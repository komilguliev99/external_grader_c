/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-02-02 21:47:58
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-02-02 23:17:56
 * @ Description:
 */

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me',
    'https://www.googleapis.com/auth/classroom.rosters',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.profile.emails',
    'https://www.googleapis.com/auth/classroom.profile.photos'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './google_scripts/token.json';
const credentials = readCredentials();

function readCredentials()
{
    let     content;

    try {
        content = fs.readFileSync("./google_scripts/credentials.json");
    } catch (error) {
        console.log(error);
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
  console.log('Authorize this app by visiting this url:', authUrl);
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
        console.log('Token stored to', TOKEN_PATH);
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
      console.log('Courses:');
      courses.forEach((course) => {
        console.log(`${course.name} (${course.id})`);
      });
    } else {
      console.log('No courses found.');
    }
  });
}

//authorize(credentials, listCourses);

const courseId = 43751834869;
const courseWorkId = null;

function    courseWorkCreator(auth)
{
    const classroom = google.classroom({version: 'v1', auth});

    const courseWork = {
        "title" : "Экзамен",
        "description" : "Экзамен по темам массивов и матриц",
        "materials" : [],
        'state' : 'PUBLISHED',
        'maxPoints' : 100,
        'workType' : 'ASSIGNMENT'
    }

    classroom.courses.courseWork.create({
        courseId,
        requestBody: courseWork
    }, (err, res) => {
        if (err) return console.error('The API returned an error: ' + err);
        courseWorkId = res.data.id;
        return console.log(res.data);
    })
}

async function getStudentId(email)
{
    authorize(credentials, auth => {
        const classroom = google.classroom({version: 'v1', auth});

        classroom.courses.students.list({courseId},{courseId}, (err, res) => {
            if (err) return console.error('The API returned an error: ' + err);
            courseWorkId = res.data.id;
            return console.log(res.data);
        });
    })
}

getStudentId("dfan@miem.hse.ru");
const   classroom = {
    createCourseWork: function (title)
    {
        authorize(credentials, courseWorkCreator);
    },
    setGrade: function (email, points)
    {
        authorize(credentials, auth => {
            var subId = getSubId(courseId, courseworkId, studentEmail);
            
            //set grades
            var resource = {'draftGrade' : points};
            var updateMask = {'updateMask' : 'draftGrade'};
            var result = Classroom.Courses.CourseWork.StudentSubmissions.patch(resource, courseId, courseworkId, subId, updateMask);
            resource = {'assignedGrade' : points};
            updateMask = {'updateMask' : 'assignedGrade'};
            result = Classroom.Courses.CourseWork.StudentSubmissions.patch(resource, courseId, courseworkId, subId, updateMask);
        })
    }
}

module.exports = classroom;