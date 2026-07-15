package com.example.schedule.service;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.dto.ScheduleBlockDto;
import com.example.schedule.dto.ScheduleSettingsResponse;
import com.example.schedule.dto.UpdateScheduleSettingsRequest;
import com.example.schedule.entity.ScheduleBlockSetting;
import com.example.schedule.model.ScheduleBlockId;
import com.example.schedule.model.Semester;
import com.example.schedule.repository.ScheduleBlockSettingRepository;

@Service
public class ScheduleSettingsService {

    private static final List<String> WEEKDAYS = List.of(
            "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY");

    private static final List<ScheduleBlockId> BLOCK_ORDER = List.of(
            ScheduleBlockId.DESAYUNO,
            ScheduleBlockId.MANANA,
            ScheduleBlockId.ALMUERZO,
            ScheduleBlockId.TARDE,
            ScheduleBlockId.CENA,
            ScheduleBlockId.NOCHE);

    private static final Map<ScheduleBlockId, String> BLOCK_LABELS = Map.of(
            ScheduleBlockId.DESAYUNO, "Desayuno",
            ScheduleBlockId.MANANA, "Turno mañana",
            ScheduleBlockId.ALMUERZO, "Almuerzo",
            ScheduleBlockId.TARDE, "Turno tarde",
            ScheduleBlockId.CENA, "Cena",
            ScheduleBlockId.NOCHE, "Turno noche");

    private static final LocalTime DAY_MIN_START = LocalTime.of(5, 0);
    private static final LocalTime DAY_MAX_END = LocalTime.of(23, 59);
    private static final int MIN_BLOCK_MINUTES = 15;

    private final ScheduleBlockSettingRepository repository;
    private final NotificationService notificationService;
    private final JdbcTemplate jdbcTemplate;
    private final ScheduleService scheduleService;

    public ScheduleSettingsService(
            ScheduleBlockSettingRepository repository,
            NotificationService notificationService,
            JdbcTemplate jdbcTemplate,
            ScheduleService scheduleService) {
        this.repository = repository;
        this.notificationService = notificationService;
        this.jdbcTemplate = jdbcTemplate;
        this.scheduleService = scheduleService;
    }

    @Transactional
    public ScheduleSettingsResponse getSettings(String semester) {
        String normalizedSemester = Semester.normalize(semester);
        seedDefaultsIfEmpty(normalizedSemester);
        return toResponse(loadOrderedBlocks(normalizedSemester));
    }

    @Transactional
    public ScheduleSettingsResponse updateSettings(String semester, UpdateScheduleSettingsRequest request) {
        String normalizedSemester = Semester.normalize(semester);
        List<ParsedBlock> parsedBlocks = parseAndValidate(request.blocks());
        Map<ScheduleBlockId, ScheduleBlockSetting> existingById = new EnumMap<>(ScheduleBlockId.class);
        repository.findBySemester(normalizedSemester).forEach(setting -> existingById.put(setting.getBlockId(), setting));

        List<ScheduleBlockSetting> saved = new ArrayList<>();
        for (ParsedBlock parsed : parsedBlocks) {
            ScheduleBlockSetting setting = existingById.get(parsed.id());
            if (setting == null) {
                setting = new ScheduleBlockSetting();
                setting.setSemester(normalizedSemester);
                setting.setBlockId(parsed.id());
            }
            setting.setStartTime(parsed.start());
            setting.setEndTime(parsed.end());
            saved.add(repository.save(setting));
        }

        saved.sort(Comparator.comparing(setting -> BLOCK_ORDER.indexOf(setting.getBlockId())));
        notificationService.record("actualizó las reglas de horario del semestre " + normalizedSemester);
        scheduleService.regenerateExistingSchedulesForSemester(normalizedSemester);
        return toResponse(saved);
    }

    @Transactional
    public void seedDefaultsIfEmpty() {
        migrateSemesterColumnIfNeeded();
        migrateOldDinnerDefaultsIfNeeded();
        seedDefaultsIfEmpty(Semester.CURRENT);
    }

    @Transactional
    public void seedDefaultsIfEmpty(String semester) {
        String normalizedSemester = Semester.normalize(semester);
        migrateSemesterColumnIfNeeded();
        migrateOldDinnerDefaultsIfNeeded();
        if (repository.countBySemester(normalizedSemester) > 0) {
            return;
        }

        List<DefaultBlock> defaults = List.of(
                new DefaultBlock(ScheduleBlockId.DESAYUNO, "06:30", "08:00"),
                new DefaultBlock(ScheduleBlockId.MANANA, "08:00", "12:30"),
                new DefaultBlock(ScheduleBlockId.ALMUERZO, "12:30", "14:00"),
                new DefaultBlock(ScheduleBlockId.TARDE, "14:00", "17:00"),
                new DefaultBlock(ScheduleBlockId.CENA, "17:00", "17:15"),
                new DefaultBlock(ScheduleBlockId.NOCHE, "17:15", "22:30"));

        for (DefaultBlock block : defaults) {
            ScheduleBlockSetting setting = new ScheduleBlockSetting();
            setting.setSemester(normalizedSemester);
            setting.setBlockId(block.id());
            setting.setStartTime(parseTime(block.start()));
            setting.setEndTime(parseTime(block.end()));
            repository.save(setting);
        }
    }

    private List<ScheduleBlockSetting> loadOrderedBlocks(String semester) {
        List<ScheduleBlockSetting> blocks = repository.findBySemester(semester);
        blocks.sort(Comparator.comparing(setting -> BLOCK_ORDER.indexOf(setting.getBlockId())));
        return blocks;
    }

    private void migrateSemesterColumnIfNeeded() {
        try {
            jdbcTemplate.execute("""
                    ALTER TABLE schedule_block_settings
                    ADD COLUMN IF NOT EXISTS semester VARCHAR(20)
                    """);
            jdbcTemplate.execute("""
                    UPDATE schedule_block_settings
                    SET semester = '26-II'
                    WHERE semester IS NULL OR semester = ''
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE schedule_block_settings
                    ALTER COLUMN semester SET NOT NULL
                    """);
            jdbcTemplate.execute("ALTER TABLE schedule_block_settings DROP CONSTRAINT IF EXISTS schedule_block_settings_pkey");
            jdbcTemplate.execute("""
                    ALTER TABLE schedule_block_settings
                    ADD CONSTRAINT schedule_block_settings_pkey
                    PRIMARY KEY (semester, block_id)
                    """);
        } catch (Exception ignored) {
        }
    }

    private void migrateOldDinnerDefaultsIfNeeded() {
        try {
            jdbcTemplate.execute("""
                    UPDATE schedule_block_settings
                    SET end_time = '17:15'
                    WHERE block_id = 'CENA'
                      AND start_time = '17:00'
                      AND end_time = '18:30'
                    """);
            jdbcTemplate.execute("""
                    UPDATE schedule_block_settings
                    SET start_time = '17:15'
                    WHERE block_id = 'NOCHE'
                      AND start_time = '18:30'
                      AND end_time = '22:30'
                    """);
        } catch (Exception ignored) {
        }
    }

    private ScheduleSettingsResponse toResponse(List<ScheduleBlockSetting> blocks) {
        List<ScheduleBlockDto> dtos = blocks.stream()
                .map(setting -> ScheduleBlockDto.from(setting, BLOCK_LABELS.get(setting.getBlockId())))
                .toList();
        return new ScheduleSettingsResponse(dtos, WEEKDAYS);
    }

    private List<ParsedBlock> parseAndValidate(List<ScheduleBlockDto> blocks) {
        if (blocks.size() != BLOCK_ORDER.size()) {
            throw badRequest("Debe enviar exactamente 6 bloques horarios");
        }

        List<ParsedBlock> parsedBlocks = new ArrayList<>();
        for (int index = 0; index < blocks.size(); index++) {
            ScheduleBlockDto block = blocks.get(index);
            ScheduleBlockId expectedId = BLOCK_ORDER.get(index);
            if (block.id() != expectedId) {
                throw badRequest("Orden inválido de bloques: se esperaba " + expectedId);
            }

            LocalTime start = parseTime(block.start());
            LocalTime end = parseTime(block.end());
            if (!start.isBefore(end)) {
                throw badRequest("Inicio debe ser anterior al fin en " + BLOCK_LABELS.get(block.id()));
            }

            int durationMinutes = end.getHour() * 60 + end.getMinute() - (start.getHour() * 60 + start.getMinute());
            if (durationMinutes < MIN_BLOCK_MINUTES) {
                throw badRequest("Duración mínima de 15 minutos en " + BLOCK_LABELS.get(block.id()));
            }

            parsedBlocks.add(new ParsedBlock(block.id(), start, end));
        }

        if (parsedBlocks.get(0).start().isBefore(DAY_MIN_START)) {
            throw badRequest("El desayuno no puede empezar antes de las 05:00");
        }

        ParsedBlock lastBlock = parsedBlocks.get(parsedBlocks.size() - 1);
        if (lastBlock.end().isAfter(DAY_MAX_END)) {
            throw badRequest("El turno noche no puede terminar después de las 23:59");
        }

        for (int index = 0; index < parsedBlocks.size() - 1; index++) {
            ParsedBlock current = parsedBlocks.get(index);
            ParsedBlock next = parsedBlocks.get(index + 1);
            if (!current.end().equals(next.start())) {
                throw badRequest("Los bloques deben encadenarse sin huecos ni solapes");
            }
        }

        return parsedBlocks;
    }

    private LocalTime parseTime(String value) {
        try {
            return LocalTime.parse(value);
        } catch (DateTimeParseException ex) {
            throw badRequest("Formato de hora inválido: " + value);
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private record DefaultBlock(ScheduleBlockId id, String start, String end) {
    }

    private record ParsedBlock(ScheduleBlockId id, LocalTime start, LocalTime end) {
    }
}
