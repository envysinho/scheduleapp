package com.example.schedule.service;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.dto.ScheduleBlockDto;
import com.example.schedule.dto.ScheduleSettingsResponse;
import com.example.schedule.dto.UpdateScheduleSettingsRequest;
import com.example.schedule.entity.ScheduleBlockSetting;
import com.example.schedule.model.Semester;
import com.example.schedule.repository.ScheduleBlockSettingRepository;

@Service
public class ScheduleSettingsService {

    private static final List<String> WEEKDAYS = List.of(
            "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY");

    private static final Map<String, String> BLOCK_LABELS = Map.of(
            "DESAYUNO", "Desayuno",
            "MANANA", "Turno mañana",
            "ALMUERZO", "Almuerzo",
            "TARDE", "Turno tarde",
            "CENA", "Cena",
            "NOCHE", "Turno noche");

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
        Map<String, ScheduleBlockSetting> existingById = new java.util.HashMap<>();
        repository.findBySemester(normalizedSemester).forEach(setting -> existingById.put(setting.getBlockId(), setting));

        List<ScheduleBlockSetting> saved = new ArrayList<>();
        Set<String> requestedIds = new HashSet<>();
        for (ParsedBlock parsed : parsedBlocks) {
            requestedIds.add(parsed.id());
            ScheduleBlockSetting setting = existingById.get(parsed.id());
            if (setting == null) {
                setting = new ScheduleBlockSetting();
                setting.setSemester(normalizedSemester);
                setting.setBlockId(parsed.id());
            }
            setting.setLabel(parsed.label());
            setting.setStartTime(parsed.start());
            setting.setEndTime(parsed.end());
            saved.add(repository.save(setting));
        }

        existingById.values().stream()
                .filter(setting -> !requestedIds.contains(setting.getBlockId()))
                .forEach(repository::delete);

        saved.sort(Comparator.comparing(ScheduleBlockSetting::getStartTime));
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
                new DefaultBlock("DESAYUNO", "Desayuno", "06:30", "08:00"),
                new DefaultBlock("MANANA", "Turno mañana", "08:00", "12:30"),
                new DefaultBlock("ALMUERZO", "Almuerzo", "12:30", "14:00"),
                new DefaultBlock("TARDE", "Turno tarde", "14:00", "17:00"),
                new DefaultBlock("CENA", "Cena", "17:00", "17:15"),
                new DefaultBlock("NOCHE", "Turno noche", "17:15", "22:30"));

        for (DefaultBlock block : defaults) {
            ScheduleBlockSetting setting = new ScheduleBlockSetting();
            setting.setSemester(normalizedSemester);
            setting.setBlockId(block.id());
            setting.setLabel(block.label());
            setting.setStartTime(parseTime(block.start()));
            setting.setEndTime(parseTime(block.end()));
            repository.save(setting);
        }
    }

    private List<ScheduleBlockSetting> loadOrderedBlocks(String semester) {
        List<ScheduleBlockSetting> blocks = repository.findBySemester(semester);
        blocks.sort(Comparator.comparing(ScheduleBlockSetting::getStartTime));
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
                    ADD COLUMN IF NOT EXISTS label VARCHAR(80)
                    """);
            BLOCK_LABELS.forEach((id, label) -> jdbcTemplate.update("""
                    UPDATE schedule_block_settings
                    SET label = ?
                    WHERE block_id = ?
                      AND (label IS NULL OR label = '')
                    """, label, id));
            jdbcTemplate.execute("""
                    UPDATE schedule_block_settings
                    SET label = block_id
                    WHERE label IS NULL OR label = ''
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE schedule_block_settings
                    ALTER COLUMN label SET NOT NULL
                    """);
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
                .map(ScheduleBlockDto::from)
                .toList();
        return new ScheduleSettingsResponse(dtos, WEEKDAYS);
    }

    private List<ParsedBlock> parseAndValidate(List<ScheduleBlockDto> blocks) {
        List<ParsedBlock> parsedBlocks = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        for (int index = 0; index < blocks.size(); index++) {
            ScheduleBlockDto block = blocks.get(index);
            if (!ids.add(block.id())) {
                throw badRequest("ID de bloque repetido: " + block.id());
            }
            String label = block.label().trim();
            if (label.isBlank()) {
                throw badRequest("Cada bloque debe tener un nombre");
            }

            LocalTime start = parseTime(block.start());
            LocalTime end = parseTime(block.end());
            if (!start.isBefore(end)) {
                throw badRequest("Inicio debe ser anterior al fin en " + label);
            }

            int durationMinutes = end.getHour() * 60 + end.getMinute() - (start.getHour() * 60 + start.getMinute());
            if (durationMinutes < MIN_BLOCK_MINUTES) {
                throw badRequest("Duración mínima de 15 minutos en " + label);
            }

            parsedBlocks.add(new ParsedBlock(block.id(), label, start, end));
        }

        if (parsedBlocks.get(0).start().isBefore(DAY_MIN_START)) {
            throw badRequest("El primer bloque no puede empezar antes de las 05:00");
        }

        ParsedBlock lastBlock = parsedBlocks.get(parsedBlocks.size() - 1);
        if (lastBlock.end().isAfter(DAY_MAX_END)) {
            throw badRequest("El último bloque no puede terminar después de las 23:59");
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

    private record DefaultBlock(String id, String label, String start, String end) {
    }

    private record ParsedBlock(String id, String label, LocalTime start, LocalTime end) {
    }
}
