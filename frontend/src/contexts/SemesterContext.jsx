import { createContext, useContext, useState } from "react";
import { CURRENT_SEMESTER } from "@/lib/semesters";

const SEMESTER_STORAGE_KEY = "schedule.semester";
const SemesterContext = createContext(null);

function getStoredSemester() {
  return localStorage.getItem(SEMESTER_STORAGE_KEY) || CURRENT_SEMESTER;
}

function SemesterProvider({ children }) {
  const [semester, setSemesterState] = useState(getStoredSemester);

  const setSemester = (value) => {
    setSemesterState(value);
    localStorage.setItem(SEMESTER_STORAGE_KEY, value);
  };

  return (
    <SemesterContext.Provider value={{ semester, setSemester }}>
      {children}
    </SemesterContext.Provider>
  );
}

function useSemester() {
  const context = useContext(SemesterContext);
  if (!context) {
    throw new Error("useSemester debe usarse dentro de SemesterProvider");
  }
  return context;
}

export { SemesterProvider, useSemester };
