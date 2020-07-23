const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = new Sequelize("sqlite::memory:", {
  logging: console.log,
});

class User extends Model {}
class Course extends Model {}
class Post extends Model {}
class School extends Model {}
class Professor extends Model {}
class Student extends Model {}
class Parent extends Model {}

async function maFonction() {
  User.init(
    {
      lastname: DataTypes.STRING,
      firstname: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      tel: DataTypes.STRING,
    },
    { sequelize, modelName: "user" }
  );

  Course.init(
    {
      name: DataTypes.STRING,
      day: DataTypes.NUMBER,
      hour: DataTypes.NUMBER,
    },
    { sequelize, modelName: "course" }
  );

  Post.init(
    {
      name: DataTypes.STRING,
      content: DataTypes.TEXT,
      picture: DataTypes.STRING,
      date: DataTypes.DATE,
    },
    { sequelize, modelName: "post" }
  );

  School.init(
    {
      name: DataTypes.STRING,
      url: DataTypes.STRING,
    },
    { sequelize, modelName: "school" }
  );

  Professor.init({}, { sequelize, modelName: "professor" });

  Student.init(
    {
      birthdate: DataTypes.DATEONLY,
    },
    { sequelize, modelName: "student" }
  );

  Parent.init({}, { sequelize, modelName: "parent" });

  Student.belongsTo(User);
  Professor.belongsTo(User);
  Parent.belongsTo(User);
  Student.belongsTo(School);
  
  School.hasMany(Student);

  Course.belongsToMany(Student, { through: "StudentCourse" });
  Student.belongsToMany(Course, {
    through: "StudentCourse",
  }); /* participate du MLD */

  Course.belongsTo(School);

  Parent.belongsToMany(Student, { through: "ParentStudent" });
  Student.belongsToMany(Parent, {
    through: "ParentStudent",
  }); /* concerns du MLD */

  Post.belongsToMany(School, { through: "PostSchool" });
  School.belongsToMany(Post, { through: "PostSchool" }); /* is for du MLD */

  Post.belongsTo(Course);

  await sequelize.sync();

  const user = await User.create({
    lastname: "DUVAL",
    firstname: "Robert",
    email: "robertd@gmail.com",
    password: "azerty",
    tel: "0612956832",
  });

  const user_2 = await User.create({
    lastname: "FRANCOIS",
    firstname: "Juste",
    email: "juste.francois@gmail.com",
    password: "aqsdfg",
    tel: "06568534",
  });

  const school = await School.create({
    name: "Ma Nouvelle Ecole",
    url: "http//gfgfghfhgfhgfhf",
  });

  const course = await Course.create({
    name: "Les Moyennes",
    day: 1,
    hour: 1630,
    schoolId: school.id,
  });

  const course_2 = await Course.create({
    name: "Les Grandes",
    day: 3,
    hour: 1800,
    schoolId: school.id,
  });

  const student = await Student.create({
    birthdate: new Date("2003-06-15"),
    userId: user.id,
    schoolId: school.id,
  });

  const student_2 = await Student.create({
    birthdate: new Date("1984-11-22"),
    userId: user_2.id,
    schoolId: school.id,
  });

  await student.addCourse(course);

  //   const query_student = await Student.findOne({where: { id: student.id }, include: ['courses']});
  // //  const query_courses = await query_student.getCourses();
  //   console.log(JSON.stringify(query_student));

  // GET /student/:id -> { id, firstname, lastname, ..., birthdate}
  const q_student = await Student.findOne();
  const q_user = await User.findOne({ where: { id: q_student.userId } });
  console.log(q_student.toJSON());
  console.log(q_user.toJSON());

  //// GET /student/:id
  const q_student_2 = await Student.findOne({
    where: { id: student.id },
    include: ["user", "courses"],
  });
  console.log("Voici le q_student_2", q_student_2);

  console.log("Voici le q_student_2", q_student_2.toJSON());

  const apiStudent = {
    id: q_student_2.id,
    firstname: q_student_2.user.firstname,
    lastname: q_student_2.user.lastname,
    birthdate: q_student_2.birthdate,
    email: q_student_2.user.email,
    tel: q_student_2.user.tel,
  };

  console.log("Voici le apiStudent", apiStudent);

  // // GET /student

  const q_students = await Student.findAll({ include: ["user", "courses"] });

  const q_studs = q_students.map((row) => row.toJSON());

  console.log(q_studs);

  const res = await apiGetStudentID(1);
  console.log(res);

  const idStudent =await apiPostStudent("Bertolt",
    "Coupaye",
    new Date("2006-05-28"),
    "bertolt@gmail.com",
    "0625456963",
    [1,2],
    1,
    "azerty2000");

    apiDeleteStudent(1);

    const newStudent = await apiGetStudentID(idStudent);
    console.log(newStudent);

    console.log( await apiGetStudents());

  // const users = await User.findAll();
  // console.log(users[0].toJSON());

  // const elo = await User.findOne({
  //   where: {
  //     username: "Eloïne",
  //   },
  // });

  // console.log("Eloïne", elo);
}
maFonction();

async function apiGetStudentID(studentId) {
  const dbStudent = await Student.findOne({
    where: {
      id: studentId,
    },
    include: ["user", "courses", "school"],
  });

  return dbToApiStudent(dbStudent);

 
}

function dbToApiStudent(dbStudent){

  const apiStudent = {
    id: dbStudent.id,
    firstname: dbStudent.user.firstname,
    lastname: dbStudent.user.lastname,
    birthdate: dbStudent.birthdate,
    email: dbStudent.user.email,
    tel: dbStudent.user.tel,
    school: {
      id: dbStudent.school.id,
      name: dbStudent.school.name,
      url: dbStudent.school.url,
    },
    courses : dbStudent.courses.map((row) => ({
      id: row.id,
      name: row.name,
      day: row.day,
      hour: row.hour
    }))
  };

  return apiStudent;
}

async function apiGetStudents() {

  const dbStudents = await Student.findAll({include: ["user", "courses", "school"]})

 return dbStudents.map(row=> dbToApiStudent(row));

}

async function apiPostStudent(
  firstname,
  lastname,
  birthdate,
  email,
  tel,
  coursesIds,
  schoolId,
  password
) {
  const user = await User.create({
    lastname,
    firstname,
    email,
    password,
    tel,
  });

  const student = await Student.create({
    birthdate,
    userId: user.id,
    schoolId,
  });

  await student.setCourses(coursesIds);
 return student.id;
}

async function apiDeleteStudent(studentId) {

  const deleteStudent = await apiGetStudentID(studentId);
  console.log("deleteStudent-------::>", deleteStudent);
  
  await deleteStudent.firstname.destroy();
}

apiGetStudentID();
