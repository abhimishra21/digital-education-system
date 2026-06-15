package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing university records
type SmartContract struct {
	contractapi.Contract
}

// Student represents a student record with versioning
type Student struct {
	StudentID      string    `json:"studentId"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	Department     string    `json:"department"`
	EnrollmentYear int       `json:"enrollmentYear"`
	Version        int       `json:"version"`
	Timestamp      string    `json:"timestamp"`
	Action         string    `json:"action"`
	PreviousVersion int      `json:"previousVersion,omitempty"`
}

// Faculty represents a faculty record with versioning
type Faculty struct {
	FacultyID      string    `json:"facultyId"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	Department     string    `json:"department"`
	Designation    string    `json:"designation"`
	Version        int       `json:"version"`
	Timestamp      string    `json:"timestamp"`
	Action         string    `json:"action"`
	PreviousVersion int      `json:"previousVersion,omitempty"`
}

// Course represents a course record with versioning
type Course struct {
	CourseID       string    `json:"courseId"`
	Name           string    `json:"name"`
	Department     string    `json:"department"`
	Credits        int       `json:"credits"`
	Instructor     string    `json:"instructor"`
	Version        int       `json:"version"`
	Timestamp      string    `json:"timestamp"`
	Action         string    `json:"action"`
	PreviousVersion int      `json:"previousVersion,omitempty"`
}

// Enrollment represents an enrollment record with versioning
type Enrollment struct {
	EnrollmentID   string    `json:"enrollmentId"`
	StudentID      string    `json:"studentId"`
	CourseID       string    `json:"courseId"`
	Semester       string    `json:"semester"`
	Year           int       `json:"year"`
	Version        int       `json:"version"`
	Timestamp      string    `json:"timestamp"`
	Action         string    `json:"action"`
	PreviousVersion int      `json:"previousVersion,omitempty"`
}

// Grade represents a grade record with versioning
type Grade struct {
	GradeID        string    `json:"gradeId"`
	StudentID      string    `json:"studentId"`
	CourseID       string    `json:"courseId"`
	Grade          string    `json:"grade"`
	Semester       string    `json:"semester"`
	Year           int       `json:"year"`
	Version        int       `json:"version"`
	Timestamp      string    `json:"timestamp"`
	Action         string    `json:"action"`
	PreviousVersion int      `json:"previousVersion,omitempty"`
}

// HistoryRecord represents a version history record
type HistoryRecord struct {
	RecordID       string    `json:"recordId"`
	RecordType     string    `json:"recordType"`
	Data           string    `json:"data"`
	Version        int       `json:"version"`
	Timestamp      string    `json:"timestamp"`
	Action         string    `json:"action"`
}

// InitLedger initializes the ledger with sample data
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	fmt.Println("Initializing University Records Ledger")
	return nil
}

// CreateStudent creates a new student record
func (s *SmartContract) CreateStudent(ctx contractapi.TransactionContextInterface, studentData string) error {
	var student Student
	err := json.Unmarshal([]byte(studentData), &student)
	if err != nil {
		return fmt.Errorf("failed to unmarshal student data: %v", err)
	}

	// Check if student already exists
	exists, err := s.StudentExists(ctx, student.StudentID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("student %s already exists", student.StudentID)
	}

	// Set initial version if not provided
	if student.Version == 0 {
		student.Version = 1
	}

	// Set timestamp if not provided
	if student.Timestamp == "" {
		student.Timestamp = time.Now().Format(time.RFC3339)
	}

	// Store student record
	studentJSON, err := json.Marshal(student)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("STUDENT_%s", student.StudentID)
	err = ctx.GetStub().PutState(key, studentJSON)
	if err != nil {
		return fmt.Errorf("failed to put student: %v", err)
	}

	// Store in history
	err = s.storeHistory(ctx, student.StudentID, "STUDENT", string(studentJSON), student.Version, student.Action)
	if err != nil {
		return err
	}

	return nil
}

// GetStudent retrieves a student record
func (s *SmartContract) GetStudent(ctx contractapi.TransactionContextInterface, studentID string) (string, error) {
	key := fmt.Sprintf("STUDENT_%s", studentID)
	studentJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", fmt.Errorf("failed to read student: %v", err)
	}
	if studentJSON == nil {
		return "", fmt.Errorf("student %s does not exist", studentID)
	}
	return string(studentJSON), nil
}

// UpdateStudent updates a student record with versioning
func (s *SmartContract) UpdateStudent(ctx contractapi.TransactionContextInterface, studentID string, studentData string) error {
	var updatedStudent Student
	err := json.Unmarshal([]byte(studentData), &updatedStudent)
	if err != nil {
		return fmt.Errorf("failed to unmarshal student data: %v", err)
	}

	// Get current student
	currentStudentJSON, err := s.GetStudent(ctx, studentID)
	if err != nil {
		return err
	}

	var currentStudent Student
	err = json.Unmarshal([]byte(currentStudentJSON), &currentStudent)
	if err != nil {
		return err
	}

	// Increment version
	updatedStudent.Version = currentStudent.Version + 1
	updatedStudent.PreviousVersion = currentStudent.Version
	updatedStudent.Timestamp = time.Now().Format(time.RFC3339)
	updatedStudent.Action = "UPDATE"

	// Store updated student
	updatedStudentJSON, err := json.Marshal(updatedStudent)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("STUDENT_%s", studentID)
	err = ctx.GetStub().PutState(key, updatedStudentJSON)
	if err != nil {
		return fmt.Errorf("failed to update student: %v", err)
	}

	// Store in history
	err = s.storeHistory(ctx, studentID, "STUDENT", string(updatedStudentJSON), updatedStudent.Version, updatedStudent.Action)
	if err != nil {
		return err
	}

	return nil
}

// GetStudentHistory retrieves version history of a student
func (s *SmartContract) GetStudentHistory(ctx contractapi.TransactionContextInterface, studentID string) (string, error) {
	historyIterator, err := ctx.GetStub().GetHistoryForKey(fmt.Sprintf("STUDENT_%s", studentID))
	if err != nil {
		return "", fmt.Errorf("failed to get student history: %v", err)
	}
	defer historyIterator.Close()

	var history []HistoryRecord
	for historyIterator.HasNext() {
		modification, err := historyIterator.Next()
		if err != nil {
			return "", fmt.Errorf("failed to iterate history: %v", err)
		}

		var student Student
		err = json.Unmarshal(modification.Value, &student)
		if err != nil {
			continue
		}

		historyRecord := HistoryRecord{
			RecordID:   studentID,
			RecordType: "STUDENT",
			Data:       string(modification.Value),
			Version:    student.Version,
			Timestamp:  student.Timestamp,
			Action:     student.Action,
		}
		history = append(history, historyRecord)
	}

	historyJSON, err := json.Marshal(history)
	if err != nil {
		return "", err
	}

	return string(historyJSON), nil
}

// StudentExists checks if a student exists
func (s *SmartContract) StudentExists(ctx contractapi.TransactionContextInterface, studentID string) (bool, error) {
	key := fmt.Sprintf("STUDENT_%s", studentID)
	studentJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return false, fmt.Errorf("failed to read student: %v", err)
	}
	return studentJSON != nil, nil
}

// GetAllStudents retrieves all students
func (s *SmartContract) GetAllStudents(ctx contractapi.TransactionContextInterface) (string, error) {
	startKey := "STUDENT_"
	endKey := "STUDENT_" + string(rune(0))

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return "", err
	}
	defer resultsIterator.Close()

	var students []Student
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return "", err
		}

		var student Student
		err = json.Unmarshal(queryResult.Value, &student)
		if err != nil {
			return "", err
		}
		students = append(students, student)
	}

	studentsJSON, err := json.Marshal(students)
	if err != nil {
		return "", err
	}

	return string(studentsJSON), nil
}

// SearchStudents searches students by department and year
func (s *SmartContract) SearchStudents(ctx contractapi.TransactionContextInterface, department string, year string) (string, error) {
	allStudentsJSON, err := s.GetAllStudents(ctx)
	if err != nil {
		return "", err
	}

	var allStudents []Student
	err = json.Unmarshal([]byte(allStudentsJSON), &allStudents)
	if err != nil {
		return "", err
	}

	var filteredStudents []Student
	for _, student := range allStudents {
		if (department == "" || student.Department == department) &&
		   (year == "" || fmt.Sprintf("%d", student.EnrollmentYear) == year) {
			filteredStudents = append(filteredStudents, student)
		}
	}

	filteredJSON, err := json.Marshal(filteredStudents)
	if err != nil {
		return "", err
	}

	return string(filteredJSON), nil
}

// Faculty Management Functions
func (s *SmartContract) CreateFaculty(ctx contractapi.TransactionContextInterface, facultyData string) error {
	var faculty Faculty
	err := json.Unmarshal([]byte(facultyData), &faculty)
	if err != nil {
		return fmt.Errorf("failed to unmarshal faculty data: %v", err)
	}

	exists, err := s.FacultyExists(ctx, faculty.FacultyID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("faculty %s already exists", faculty.FacultyID)
	}

	if faculty.Version == 0 {
		faculty.Version = 1
	}
	if faculty.Timestamp == "" {
		faculty.Timestamp = time.Now().Format(time.RFC3339)
	}

	facultyJSON, err := json.Marshal(faculty)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("FACULTY_%s", faculty.FacultyID)
	err = ctx.GetStub().PutState(key, facultyJSON)
	if err != nil {
		return fmt.Errorf("failed to put faculty: %v", err)
	}

	return s.storeHistory(ctx, faculty.FacultyID, "FACULTY", string(facultyJSON), faculty.Version, faculty.Action)
}

func (s *SmartContract) GetFaculty(ctx contractapi.TransactionContextInterface, facultyID string) (string, error) {
	key := fmt.Sprintf("FACULTY_%s", facultyID)
	facultyJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", fmt.Errorf("failed to read faculty: %v", err)
	}
	if facultyJSON == nil {
		return "", fmt.Errorf("faculty %s does not exist", facultyID)
	}
	return string(facultyJSON), nil
}

func (s *SmartContract) UpdateFaculty(ctx contractapi.TransactionContextInterface, facultyID string, facultyData string) error {
	var updatedFaculty Faculty
	err := json.Unmarshal([]byte(facultyData), &updatedFaculty)
	if err != nil {
		return fmt.Errorf("failed to unmarshal faculty data: %v", err)
	}

	currentFacultyJSON, err := s.GetFaculty(ctx, facultyID)
	if err != nil {
		return err
	}

	var currentFaculty Faculty
	err = json.Unmarshal([]byte(currentFacultyJSON), &currentFaculty)
	if err != nil {
		return err
	}

	updatedFaculty.Version = currentFaculty.Version + 1
	updatedFaculty.PreviousVersion = currentFaculty.Version
	updatedFaculty.Timestamp = time.Now().Format(time.RFC3339)
	updatedFaculty.Action = "UPDATE"

	updatedFacultyJSON, err := json.Marshal(updatedFaculty)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("FACULTY_%s", facultyID)
	err = ctx.GetStub().PutState(key, updatedFacultyJSON)
	if err != nil {
		return fmt.Errorf("failed to update faculty: %v", err)
	}

	return s.storeHistory(ctx, facultyID, "FACULTY", string(updatedFacultyJSON), updatedFaculty.Version, updatedFaculty.Action)
}

func (s *SmartContract) FacultyExists(ctx contractapi.TransactionContextInterface, facultyID string) (bool, error) {
	key := fmt.Sprintf("FACULTY_%s", facultyID)
	facultyJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return false, fmt.Errorf("failed to read faculty: %v", err)
	}
	return facultyJSON != nil, nil
}

func (s *SmartContract) GetAllFaculty(ctx contractapi.TransactionContextInterface) (string, error) {
	startKey := "FACULTY_"
	endKey := "FACULTY_" + string(rune(0))

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return "", err
	}
	defer resultsIterator.Close()

	var faculty []Faculty
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return "", err
		}

		var f Faculty
		err = json.Unmarshal(queryResult.Value, &f)
		if err != nil {
			return "", err
		}
		faculty = append(faculty, f)
	}

	facultyJSON, err := json.Marshal(faculty)
	if err != nil {
		return "", err
	}

	return string(facultyJSON), nil
}

// Course Management Functions
func (s *SmartContract) CreateCourse(ctx contractapi.TransactionContextInterface, courseData string) error {
	var course Course
	err := json.Unmarshal([]byte(courseData), &course)
	if err != nil {
		return fmt.Errorf("failed to unmarshal course data: %v", err)
	}

	exists, err := s.CourseExists(ctx, course.CourseID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("course %s already exists", course.CourseID)
	}

	if course.Version == 0 {
		course.Version = 1
	}
	if course.Timestamp == "" {
		course.Timestamp = time.Now().Format(time.RFC3339)
	}

	courseJSON, err := json.Marshal(course)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("COURSE_%s", course.CourseID)
	err = ctx.GetStub().PutState(key, courseJSON)
	if err != nil {
		return fmt.Errorf("failed to put course: %v", err)
	}

	return s.storeHistory(ctx, course.CourseID, "COURSE", string(courseJSON), course.Version, course.Action)
}

func (s *SmartContract) GetCourse(ctx contractapi.TransactionContextInterface, courseID string) (string, error) {
	key := fmt.Sprintf("COURSE_%s", courseID)
	courseJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", fmt.Errorf("failed to read course: %v", err)
	}
	if courseJSON == nil {
		return "", fmt.Errorf("course %s does not exist", courseID)
	}
	return string(courseJSON), nil
}

func (s *SmartContract) UpdateCourse(ctx contractapi.TransactionContextInterface, courseID string, courseData string) error {
	var updatedCourse Course
	err := json.Unmarshal([]byte(courseData), &updatedCourse)
	if err != nil {
		return fmt.Errorf("failed to unmarshal course data: %v", err)
	}

	currentCourseJSON, err := s.GetCourse(ctx, courseID)
	if err != nil {
		return err
	}

	var currentCourse Course
	err = json.Unmarshal([]byte(currentCourseJSON), &currentCourse)
	if err != nil {
		return err
	}

	updatedCourse.Version = currentCourse.Version + 1
	updatedCourse.PreviousVersion = currentCourse.Version
	updatedCourse.Timestamp = time.Now().Format(time.RFC3339)
	updatedCourse.Action = "UPDATE"

	updatedCourseJSON, err := json.Marshal(updatedCourse)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("COURSE_%s", courseID)
	err = ctx.GetStub().PutState(key, updatedCourseJSON)
	if err != nil {
		return fmt.Errorf("failed to update course: %v", err)
	}

	return s.storeHistory(ctx, courseID, "COURSE", string(updatedCourseJSON), updatedCourse.Version, updatedCourse.Action)
}

func (s *SmartContract) CourseExists(ctx contractapi.TransactionContextInterface, courseID string) (bool, error) {
	key := fmt.Sprintf("COURSE_%s", courseID)
	courseJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return false, fmt.Errorf("failed to read course: %v", err)
	}
	return courseJSON != nil, nil
}

func (s *SmartContract) GetAllCourses(ctx contractapi.TransactionContextInterface) (string, error) {
	startKey := "COURSE_"
	endKey := "COURSE_" + string(rune(0))

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return "", err
	}
	defer resultsIterator.Close()

	var courses []Course
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return "", err
		}

		var course Course
		err = json.Unmarshal(queryResult.Value, &course)
		if err != nil {
			return "", err
		}
		courses = append(courses, course)
	}

	coursesJSON, err := json.Marshal(courses)
	if err != nil {
		return "", err
	}

	return string(coursesJSON), nil
}

// Enrollment Management Functions
func (s *SmartContract) CreateEnrollment(ctx contractapi.TransactionContextInterface, enrollmentData string) error {
	var enrollment Enrollment
	err := json.Unmarshal([]byte(enrollmentData), &enrollment)
	if err != nil {
		return fmt.Errorf("failed to unmarshal enrollment data: %v", err)
	}

	exists, err := s.EnrollmentExists(ctx, enrollment.EnrollmentID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("enrollment %s already exists", enrollment.EnrollmentID)
	}

	if enrollment.Version == 0 {
		enrollment.Version = 1
	}
	if enrollment.Timestamp == "" {
		enrollment.Timestamp = time.Now().Format(time.RFC3339)
	}

	enrollmentJSON, err := json.Marshal(enrollment)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("ENROLLMENT_%s", enrollment.EnrollmentID)
	err = ctx.GetStub().PutState(key, enrollmentJSON)
	if err != nil {
		return fmt.Errorf("failed to put enrollment: %v", err)
	}

	return s.storeHistory(ctx, enrollment.EnrollmentID, "ENROLLMENT", string(enrollmentJSON), enrollment.Version, enrollment.Action)
}

func (s *SmartContract) GetEnrollment(ctx contractapi.TransactionContextInterface, enrollmentID string) (string, error) {
	key := fmt.Sprintf("ENROLLMENT_%s", enrollmentID)
	enrollmentJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", fmt.Errorf("failed to read enrollment: %v", err)
	}
	if enrollmentJSON == nil {
		return "", fmt.Errorf("enrollment %s does not exist", enrollmentID)
	}
	return string(enrollmentJSON), nil
}

func (s *SmartContract) EnrollmentExists(ctx contractapi.TransactionContextInterface, enrollmentID string) (bool, error) {
	key := fmt.Sprintf("ENROLLMENT_%s", enrollmentID)
	enrollmentJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return false, fmt.Errorf("failed to read enrollment: %v", err)
	}
	return enrollmentJSON != nil, nil
}

// Grade Management Functions
func (s *SmartContract) CreateGrade(ctx contractapi.TransactionContextInterface, gradeData string) error {
	var grade Grade
	err := json.Unmarshal([]byte(gradeData), &grade)
	if err != nil {
		return fmt.Errorf("failed to unmarshal grade data: %v", err)
	}

	exists, err := s.GradeExists(ctx, grade.GradeID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("grade %s already exists", grade.GradeID)
	}

	if grade.Version == 0 {
		grade.Version = 1
	}
	if grade.Timestamp == "" {
		grade.Timestamp = time.Now().Format(time.RFC3339)
	}

	gradeJSON, err := json.Marshal(grade)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("GRADE_%s", grade.GradeID)
	err = ctx.GetStub().PutState(key, gradeJSON)
	if err != nil {
		return fmt.Errorf("failed to put grade: %v", err)
	}

	return s.storeHistory(ctx, grade.GradeID, "GRADE", string(gradeJSON), grade.Version, grade.Action)
}

func (s *SmartContract) GetGrade(ctx contractapi.TransactionContextInterface, gradeID string) (string, error) {
	key := fmt.Sprintf("GRADE_%s", gradeID)
	gradeJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", fmt.Errorf("failed to read grade: %v", err)
	}
	if gradeJSON == nil {
		return "", fmt.Errorf("grade %s does not exist", gradeID)
	}
	return string(gradeJSON), nil
}

func (s *SmartContract) UpdateGrade(ctx contractapi.TransactionContextInterface, gradeID string, gradeData string) error {
	var updatedGrade Grade
	err := json.Unmarshal([]byte(gradeData), &updatedGrade)
	if err != nil {
		return fmt.Errorf("failed to unmarshal grade data: %v", err)
	}

	currentGradeJSON, err := s.GetGrade(ctx, gradeID)
	if err != nil {
		return err
	}

	var currentGrade Grade
	err = json.Unmarshal([]byte(currentGradeJSON), &currentGrade)
	if err != nil {
		return err
	}

	updatedGrade.Version = currentGrade.Version + 1
	updatedGrade.PreviousVersion = currentGrade.Version
	updatedGrade.Timestamp = time.Now().Format(time.RFC3339)
	updatedGrade.Action = "UPDATE"

	updatedGradeJSON, err := json.Marshal(updatedGrade)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("GRADE_%s", gradeID)
	err = ctx.GetStub().PutState(key, updatedGradeJSON)
	if err != nil {
		return fmt.Errorf("failed to update grade: %v", err)
	}

	return s.storeHistory(ctx, gradeID, "GRADE", string(updatedGradeJSON), updatedGrade.Version, updatedGrade.Action)
}

func (s *SmartContract) GradeExists(ctx contractapi.TransactionContextInterface, gradeID string) (bool, error) {
	key := fmt.Sprintf("GRADE_%s", gradeID)
	gradeJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return false, fmt.Errorf("failed to read grade: %v", err)
	}
	return gradeJSON != nil, nil
}

// Helper function to store history
func (s *SmartContract) storeHistory(ctx contractapi.TransactionContextInterface, recordID, recordType, data string, version int, action string) error {
	historyRecord := HistoryRecord{
		RecordID:   recordID,
		RecordType: recordType,
		Data:       data,
		Version:    version,
		Timestamp:  time.Now().Format(time.RFC3339),
		Action:     action,
	}

	historyJSON, err := json.Marshal(historyRecord)
	if err != nil {
		return err
	}

	historyKey := fmt.Sprintf("HISTORY_%s_%s_%d", recordType, recordID, version)
	return ctx.GetStub().PutState(historyKey, historyJSON)
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		fmt.Printf("Error creating university records chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting university records chaincode: %s", err.Error())
	}
} 