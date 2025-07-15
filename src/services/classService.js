import { 
  getClasses as getClassesFromData, 
  addClass as addClassToData, 
  updateClass as updateClassInData, 
  deleteClass as deleteClassFromData 
} from "./dataService";

// Class management service that provides centralized class operations
// This service ensures class data consistency across all components

class ClassService {
  constructor() {
    this.listeners = new Set();
    this.classes = [];
    this.isInitialized = false;
  }

  // Subscribe to class changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners about class changes
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.classes));
  }

  // Initialize class service with current data
  async initialize(userId, useSupabase = false) {
    if (this.isInitialized) return this.classes;
    
    try {
      this.classes = await getClassesFromData(userId, useSupabase);
      this.isInitialized = true;
      this.notifyListeners();
      return this.classes;
    } catch (error) {
      console.error('Error initializing class service:', error);
      this.classes = [];
      return this.classes;
    }
  }

  // Get current classes (for components that need direct access)
  getCurrentClasses() {
    return [...this.classes];
  }

  // Get all classes
  getClasses() {
    return this.classes;
  }

  // Get a specific class by ID
  getClass(classId) {
    return this.classes.find(cls => cls.id === classId);
  }

  // Add a new class
  async addClass(classObj, useSupabase = false) {
    try {
      const newClass = await addClassToData(classObj, useSupabase);
      if (newClass) {
        this.classes = [...this.classes, newClass];
        this.notifyListeners();
      }
      return newClass;
    } catch (error) {
      console.error('Error adding class:', error);
      return null;
    }
  }

  // Update an existing class
  async updateClass(classId, updatedClass, useSupabase = false) {
    try {
      const result = await updateClassInData(classId, updatedClass, useSupabase);
      if (result) {
        this.classes = this.classes.map(cls => 
          cls.id === classId ? { ...cls, ...result } : cls
        );
        this.notifyListeners();
      }
      return result;
    } catch (error) {
      console.error('Error updating class:', error);
      return null;
    }
  }

  // Delete a class
  async deleteClass(classId, useSupabase = false) {
    try {
      const success = await deleteClassFromData(classId, useSupabase);
      if (success) {
        this.classes = this.classes.filter(cls => cls.id !== classId);
        this.notifyListeners();
      }
      return success;
    } catch (error) {
      console.error('Error deleting class:', error);
      return false;
    }
  }

  // Force refresh classes from data source
  async refreshClasses(userId, useSupabase = false) {
    try {
      this.classes = await getClassesFromData(userId, useSupabase);
      this.notifyListeners();
      return this.classes;
    } catch (error) {
      console.error('Error refreshing classes:', error);
      return this.classes;
    }
  }

  // Reset the service (useful for user logout)
  reset() {
    this.classes = [];
    this.isInitialized = false;
    this.notifyListeners();
  }
}

// Create a singleton instance
const classService = new ClassService();

export default classService;