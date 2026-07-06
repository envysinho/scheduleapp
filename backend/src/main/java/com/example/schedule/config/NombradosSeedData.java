package com.example.schedule.config;

import java.util.ArrayList;
import java.util.List;

public final class NombradosSeedData {

    public static final String SEED_FLAG = "nombrados_v2";

    private NombradosSeedData() {
    }

    public enum DayChoicePattern {
        OPTION_A,
        OPTION_B
    }

    public enum ShiftModality {
        BOTH,
        MORNING,
        AFTERNOON,
        NIGHT
    }

    public record TeacherCourseChoice(
            String courseCode,
            String courseName,
            int cycle,
            ShiftModality modality) {
    }

    public record TeacherSeed(
            String firstName,
            String lastName,
            String email,
            DayChoicePattern dayPattern,
            List<TeacherCourseChoice> courses) {
    }

    public record CourseAssignment(
            String courseCode,
            int teacherIndex,
            ShiftModality modality) {
    }

    public static final List<TeacherSeed> TEACHERS = List.of(
            // Opción A: 1 curso en mañana y tarde (docentes 1–8)
            teacherOptionA("María", "García", "maria.garcia@unc.edu.pe",
                    choice("ISEE240105", "Teoría General de Sistemas", 1, ShiftModality.BOTH)),
            teacherOptionA("Carlos", "López", "carlos.lopez@unc.edu.pe",
                    choice("ISES240106", "Algoritmo y Fundamentos de Programación", 1, ShiftModality.BOTH)),
            teacherOptionA("Ana", "Torres", "ana.torres@unc.edu.pe",
                    choice("ISEE240204", "Física General", 2, ShiftModality.BOTH)),
            teacherOptionA("Luis", "Ramírez", "luis.ramirez@unc.edu.pe",
                    choice("ISES240205", "Estructura de Datos", 2, ShiftModality.BOTH)),
            teacherOptionA("Patricia", "Mendoza", "patricia.mendoza@unc.edu.pe",
                    choice("ISEE240304", "Matemática Superior", 3, ShiftModality.BOTH)),
            teacherOptionA("Jorge", "Huamán", "jorge.huaman@unc.edu.pe",
                    choice("ISES240306", "Programación Orientada a Objetos", 3, ShiftModality.BOTH)),
            teacherOptionA("Rosa", "Quispe", "rosa.quispe@unc.edu.pe",
                    choice("ISEE240403", "Estadística y Probabilidades", 4, ShiftModality.BOTH)),
            teacherOptionA("Miguel", "Castillo", "miguel.castillo@unc.edu.pe",
                    choice("ISES240407", "Desarrollo Web Full Stack", 4, ShiftModality.BOTH)),
            // Opción B: 2 cursos en turnos distintos (docentes 9–17) — 2 turnos por docente
            teacherOptionB("Carmen", "Vásquez", "carmen.vasquez@unc.edu.pe",
                    choice("ISES240206", "Dibujo CAD", 2, ShiftModality.MORNING),
                    choice("ISEE240305", "Investigación Operativa I", 3, ShiftModality.AFTERNOON)),
            teacherOptionB("Fernando", "Ríos", "fernando.rios@unc.edu.pe",
                    choice("ISEE240404", "Investigación Operativa II", 4, ShiftModality.MORNING),
                    choice("ISEE240901", "Seminario Tesis I", 9, ShiftModality.NIGHT)),
            teacherOptionB("Lucía", "Paredes", "lucia.paredes@unc.edu.pe",
                    choice("ISES240406", "Fundamentos de Base de Datos", 4, ShiftModality.MORNING),
                    choice("ISEE240902", "Práctica Preprofesional I", 9, ShiftModality.NIGHT)),
            teacherOptionB("Ricardo", "Salazar", "ricardo.salazar@unc.edu.pe",
                    choice("ISES240502", "Introducción al Networking", 5, ShiftModality.MORNING),
                    choice("ISES240903", "Ciberseguridad", 9, ShiftModality.NIGHT)),
            teacherOptionB("Elena", "Morales", "elena.morales@unc.edu.pe",
                    choice("ISES240504", "Administración de Base de Datos", 5, ShiftModality.MORNING),
                    choice("ISES240904", "Programación Funcional y Reactiva", 9, ShiftModality.NIGHT)),
            teacherOptionB("Diego", "Flores", "diego.flores@unc.edu.pe",
                    choice("ISES240506", "Simulación de Sistemas", 5, ShiftModality.MORNING),
                    choice("ISES240905", "Inteligencia de Negocios", 9, ShiftModality.NIGHT)),
            teacherOptionB("Sofía", "Herrera", "sofia.herrera@unc.edu.pe",
                    choice("ISES240601", "Diseño de Redes de Comunicaciones", 6, ShiftModality.MORNING),
                    choice("IS-ELECTIVO-I", "Electivo I", 9, ShiftModality.NIGHT)),
            teacherOptionB("Andrés", "Campos", "andres.campos@unc.edu.pe",
                    choice("ISES240603", "Data Warehouse", 6, ShiftModality.MORNING),
                    choice("ISEE241001", "Seminario Tesis II", 10, ShiftModality.NIGHT)),
            teacherOptionB("Valeria", "Núñez", "valeria.nunez@unc.edu.pe",
                    choice("ISES240605", "Inteligencia Artificial y Sistemas Expertos", 6, ShiftModality.MORNING),
                    choice("ISEE241002", "Práctica Preprofesional II", 10, ShiftModality.NIGHT)));

    public static final List<CourseAssignment> COURSE_ASSIGNMENTS = buildCourseAssignments();

    public static List<TeacherCourseChoice> preferenceCourses(TeacherSeed seed) {
        return seed.courses();
    }

    private static List<CourseAssignment> buildCourseAssignments() {
        List<CourseAssignment> assignments = new ArrayList<>();
        for (int index = 0; index < TEACHERS.size(); index++) {
            for (TeacherCourseChoice course : TEACHERS.get(index).courses()) {
                assignments.add(new CourseAssignment(course.courseCode(), index, course.modality()));
            }
        }
        return List.copyOf(assignments);
    }

    private static TeacherSeed teacherOptionA(
            String firstName,
            String lastName,
            String email,
            TeacherCourseChoice course) {
        return new TeacherSeed(
                firstName,
                lastName,
                email,
                DayChoicePattern.OPTION_A,
                List.of(course));
    }

    private static TeacherSeed teacherOptionB(
            String firstName,
            String lastName,
            String email,
            TeacherCourseChoice... courses) {
        return new TeacherSeed(
                firstName,
                lastName,
                email,
                DayChoicePattern.OPTION_B,
                List.of(courses));
    }

    private static TeacherCourseChoice choice(
            String courseCode,
            String courseName,
            int cycle,
            ShiftModality modality) {
        return new TeacherCourseChoice(courseCode, courseName, cycle, modality);
    }
}
