"use client";

import { EducationHub } from "../components/EducationHub";
import Navbar from "../components/Navbar";

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      <Navbar />
      <div className="pt-24"> {/* Adds space below navbar */}
        <EducationHub />
      </div>
    </div>
  );
}
