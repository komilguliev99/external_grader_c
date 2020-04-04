/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-02-02 21:47:58
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-04 12:54:54
 * @ Description:
 */

const     fs        = require('fs');
const     readline  = require('readline');
const     {google}  = require('googleapis');
const     lib       = require('../config/lib');
const     gl        = require('../config/global');


// If modifying these scopes, delete token.json.
const SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me',
    'https://www.googleapis.com/auth/classroom.rosters',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.profile.emails',
    'https://www.googleapis.com/auth/classroom.profile.photos',
    'https://www.googleapis.com/auth/admin.directory.group.readonly',
    'https://www.googleapis.com/auth/admin.directory.group',
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.orgunit',
    'https://www.googleapis.com/auth/admin.directory.orgunit.readonly'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = `${gl.google.path}${gl.google.token}`;
const credentials = readCredentials();

function readCredentials()
{
    let     content;

    try {
        content = fs.readFileSync(`${gl.google.path}${gl.google.credentials}`);
    } catch (error) {
        lib.logOut(error);
        return null;
    }
    return JSON.parse(content);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function authorize2(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oauth2Client, callback);
    oauth2Client.credentials = JSON.parse(token);
    callback(oauth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  lib.logOut('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        lib.logOut('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the first 10 courses the user has access to.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listCourses(auth) {
  const classroom = google.classroom({version: 'v1', auth});
  classroom.courses.list({
    pageSize: 10,
  }, (err, res) => {
    if (err) return console.error('The API returned an error: ' + err);
    const courses = res.data.courses;
    if (courses && courses.length) {
      lib.logOut('Courses:');
      courses.forEach((course) => {
        lib.logOut(`${course.name} (${course.id})`);
      });
    } else {
      lib.logOut('No courses found.');
    }
  });
}

//authorize(credentials, listCourses);

const courseId = 43751834869;
const courseWorkId = 61741339469;


// create course callback
function    courseWorkCreator(auth, resolve, reject, conf)
{
    const classroom = google.classroom({version: 'v1', auth});

    const courseWork = {
        "title" : conf.title,
        "description" : "Экзамен по темам массивов и матриц",
        "materials" : [],
        'state' : 'PUBLISHED',
        'maxPoints' : conf.points ? conf.points : 100,
        'workType' : 'ASSIGNMENT'
    }

    classroom.courses.courseWork.create({
        courseId: conf.courseId,
        requestBody: courseWork
    })
    .then(res => resolve(res))
    .catch(err => reject(err));
};


// get submission list callback
function    submissionList(auth, resolve, reject, courseId, courseWorkId)
{
  const classroom = google.classroom({version: 'v1', auth});
  
  classroom.courses.courseWork.studentSubmissions.list({
      courseId,
      courseWorkId
  })
  .then(res => resolve(res))
  .catch(err => reject(err));
};


// get students list callback
function    studentsList(auth, resolve, reject, courseId)
{
  const classroom = google.classroom({version: 'v1', auth});
    
  classroom.courses.students.list({
    courseId
  })
  .then(res => resolve(res))
  .catch(err => reject(err));
}

// set grade of submission
function    setStudentGrade(auth, resolve, reject, conf)
{
  const classroom = google.classroom({version: 'v1', auth});

  classroom.courses.courseWork.studentSubmissions.patch(conf)
  .then(res => resolve(res))
  .catch(err => reject(err));
}

//getStudentId("dfan@miem.hse.ru");
const   classroom = {
    setCourseId: function (courseId)
    {
      this.courseId = courseId;
    },

    setCourseWorkId: function (id)
    {
      this.courseWorkId = id;
    },

    createCourse: async function (config = {})
    {
      let   courseId = null;

      if (!config.ownerId)
        config.ownerId = "me";
      if (!config.name)
        console.log("Required name of course!");
      else
      {
        await new Promise((resolve, reject) => {
          authorize(credentials, auth => {
            const classroom = google.classroom({version: 'v1', auth});
            
            classroom.courses.create({ requestBody: config })
            .then(res => resolve(res.data))
            .catch(err => reject(err));
          });
        })
        .then(res => courseId = res.id)
        .catch(err => console.log(err));
      }
      return courseId;
    },

    createCourseWork: async function (config, courseId)
    {
        let conf = { ...config };
        conf.courseId = courseId;
        await new Promise((resolve, reject) => {
          authorize(credentials, (auth) => courseWorkCreator(auth, resolve, reject, conf));
        })
        .then(res => conf.courseWorkId = res.data.id)
        .catch(err => lib.logOut(err));
        return conf.courseWorkId;
    },


    studentSubList: async function (courseId, courseWorkId)
    {
      let     subList;

      lib.logOut("SUBMISSION LIST: ")
      await new Promise((resolve, reject) => {
        authorize(credentials, (auth) => submissionList(auth, resolve, reject, courseId, courseWorkId));
      })
      .then(res => subList = res.data.studentSubmissions)
      .catch(err => lib.logOut(err));
      lib.logOut("SUBMISSION LIST: END!!!!");
      return subList;
    },


    studentsList: async function (courseId)
    {
      let       studentList = null;

      lib.logOut("students LIST: ")
      await new Promise((resolve, reject) => {
        authorize(credentials, (auth) => studentsList(auth, resolve, reject, courseId));
      })
      .then(res => studentList = res.data.students)
      .catch(err => lib.logOut(err));
      lib.logOut("students LIST: END!!!!");

      return studentList;
    },


    getStudentId: async function (email, courseId)
    {
        let     studentId = null;
        let     studentList = null;

        studentList = await this.studentsList.call(this, courseId);
        lib.logOut("StudentList: ", studentList);

        if (studentList && studentList.length > 0)
        {
          let     i = 0;

          while (i < studentList.length)
          {
            if (studentList[i].profile.emailAddress == email)
              return studentList[i].userId;
            i++;
          }

          lib.logOut("There is no students with email: ", email);
        }
        lib.logOut("There is no students in course!");
        return null;
    },

    getSubId: async function (userId, courseId, courseWorkId)
    {
      let     subList = null;

      subList = await this.studentSubList.call(this, courseId, courseWorkId);
      //lib.logOut("SUBLIST: ", subList);
      
      if (subList && subList.length > 0)
      {
        let     i = 0;

        while (i < subList.length)
        {
          if (subList[i].userId == userId)
            return subList[i].id;
          i++;
        }
      }
      return null;
    },

    setGrade: async function (email, points, courseId, courseWorkId)
    {
      let     subId;
      let     userId = await this.getStudentId.call(this, email, courseId);
      let     updateMask = {'updateMask' : 'assignedGrade'};

      lib.logOut("USER_ID: ", userId);
      if (userId)
      {
        subId = await this.getSubId.call(this, userId, courseId, courseWorkId);
        lib.logOut("SetGrade: subId: ", subId);

        let conf = {
          requestBody: {
            "assignedGrade" : points
          },
          courseId: courseId,
          courseWorkId: courseWorkId,
          id: subId,
          ...updateMask
        }
        await new Promise((resolve, reject) => {
          authorize(credentials, (auth) => setStudentGrade(auth, resolve, reject, conf));
        })
        .then(data => lib.logOut(data.data))
        .catch(err => lib.logOut(err));
      }
      else
        lib.logOut("ERROR: no userId!");
    }
}

const   directory = {

  getOrgUnitPath: function (group)
  {
    let     path = null;
    let     prefix = group.slice(0, 3);

    if (prefix == 'БИВ')
      path = 'ИВТ';
    else if (prefix == 'БИБ')
      path = 'ИБ';
    else if (prefix == 'БИТ')
      path = 'ИТСС';
    else if (prefix == 'БПМ')
      path = 'ПМ';

    if (path)
      return `orgUnitPath='/Образовательные программы/Бакалавриат/${path}/${group}'`;
    else
      return null;
  },

  getUsers: function (result)
  {
    let   users = [];
    result.data.users.forEach(user => {          
      let   i = 0;
      while (user.emails.length > i)
      {
        if (user.emails[i].primary)
        {
          users.push({ 
            gmail: user.emails[i].address,
            name: user.name.givenName
          });
          break ;
        }
        i++;
      }
    });
    return users;
  },

  getGroupByGmail: async function (gmail)
  {
    let   result;
    let   params = {
      domain: "miem.hse.ru",
      query: `email=${gmail}`
    };

    await new Promise((resolve, reject) => {
      authorize(credentials, (auth) => {
        const service = google.admin({version: 'directory_v1', auth});
        service.users.list(params)
        .then(res => resolve(res))
        .catch(err => reject(err));
      })
    })
    .then (res => result = res)
    .catch(err => console.log("ERRROR\n", err));

    if (!result || !result.data || !result.data.users)
      return false;
    else
    {
      let items = result.data.users[0].orgUnitPath.split('/');
      return items[items.length - 1];
    }

  },

  getGroup: async function (group)
  {
    let     orgUnitPath = this.getOrgUnitPath(group);
    let     result = null;
    
    if (orgUnitPath)
    {
      let   params = {
        domain: "miem.hse.ru",
        query: orgUnitPath
      };

      await new Promise((resolve, reject) => {
        authorize(credentials, (auth) => {
          const service = google.admin({version: 'directory_v1', auth});
          service.users.list(params)
          .then(res => resolve(res))
          .catch(err => reject(err));
        })
      })
      .then (res => result = res)
      .catch(err => console.log("ERRROR\n", err));

      if (result)
        return this.getUsers(result);
      else
        return null;
      
    } else
    {
      console.log("No such group!");
      return false;
    }
  }
}

module.exports.class = classroom;
module.exports.directory = directory;