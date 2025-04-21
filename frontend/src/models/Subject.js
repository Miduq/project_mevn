// frontend/src/models/Subject.js

class Subject {
  constructor(data = {}) {
    this.id = data.id || null;
    this.subject = data.subject || "";
  }
}

export default Subject;
