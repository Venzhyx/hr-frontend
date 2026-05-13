import React, { useState } from "react";
import { HiOutlineTable, HiOutlineViewGrid } from "react-icons/hi";
import TimeOffTablePage    from "./IndexTableMode";
import TimeOffCalendarPage from "./IndexCalendarMode";

const TimeOffIndexPage = () => {
  const [tab, setTab] = useState("table");

  return (
    <div className="w-full">

      {/* Tab Bar — centered pill */}
      <div className="flex justify-center pt-6 px-4 md:px-6">
        <div className="inline-flex bg-gray-100 p-1 rounded-full">
          <button
            onClick={() => setTab("table")}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
              tab === "table"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <HiOutlineTable className="w-4 h-4" />
            Table
          </button>
          <button
            onClick={() => setTab("calendar")}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
              tab === "calendar"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <HiOutlineViewGrid className="w-4 h-4" />
            Calendar
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === "table" ? <TimeOffTablePage /> : <TimeOffCalendarPage />}
    </div>
  );
};

export default TimeOffIndexPage;
