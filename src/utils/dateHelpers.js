// Date formatting and manipulation utilities

// Format a Date object to YYYY-MM-DD string
export const formatDateForInput = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format time string (HH:MM) to 12-hour display format
export const formatTimeForDisplay = (timeString) => {
  if (!timeString) return "";

  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${ampm}`;
};

// Get the start of the week for a given date
export const getStartOfWeek = (date) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  return startOfWeek;
};

// Check if two dates are the same day
export const isSameDay = (date1, date2) => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

// Navigate to previous period based on view
export const getPreviousPeriod = (currentDate, view) => {
  const newDate = new Date(currentDate);
  if (view === "month") {
    newDate.setMonth(newDate.getMonth() - 1);
  } else if (view === "week") {
    newDate.setDate(newDate.getDate() - 7);
  } else if (view === "day") {
    newDate.setDate(newDate.getDate() - 1);
  }
  return newDate;
};

// Navigate to next period based on view
export const getNextPeriod = (currentDate, view) => {
  const newDate = new Date(currentDate);
  if (view === "month") {
    newDate.setMonth(newDate.getMonth() + 1);
  } else if (view === "week") {
    newDate.setDate(newDate.getDate() + 7);
  } else if (view === "day") {
    newDate.setDate(newDate.getDate() + 1);
  }
  return newDate;
};

// Format hour to 12-hour format with AM/PM
export const formatHourForDisplay = (hour) => {
  const format12Hours = hour % 12 || 12;
  const ampm = hour < 12 ? " AM" : " PM";
  return `${format12Hours}${ampm}`;
};

// Get weekday headers array
export const getWeekdayHeaders = () => {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
};

// Get calendar title based on view and date
export const getCalendarTitle = (currentDate, view) => {
  if (view === "month") {
    return currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  } else if (view === "week") {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return `${startOfWeek.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${endOfWeek.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  } else {
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
};