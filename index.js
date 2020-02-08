/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-23 11:46:10
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-02-02 22:27:33
 * @ Description:
 */


var http = require('./gitlab_scripts/http');
var fs = require('fs');
var global = require('./configs/global');
var Grader = require('./framework/components/Grader');
var lib = require('./lib');
const	zulip = require('./gitlab_scripts/zulip');
const	classroom = require('./google_scripts/classroom');

var students = fs.readFileSync("./" + global.GITLAB_STUDENTS_INFO);
students = JSON.parse(students).students;
//console.log(students);

async function checkLastUpdate(student)
{
	//console.log("BEFORE CHECKING: ", student);
	let commits = await http.commitList(student.projectId);
	let lastUpdate;
	if (commits && commits.length > 0)
	{
		//console.log(commits);
		lastUpdate = commits[0]['committed_date'];

		console.log("LAST: ", lastUpdate, "  STUD: ", student.lastUpdate);
		if (lastUpdate && (!student.lastUpdate || new Date(student.lastUpdate) < new Date(lastUpdate)))
		{
			//console.log("ENTERED");
			student.lastUpdate = lastUpdate;
			return {
				status: true,
				date: lastUpdate
			};
		}
	}
	return { status: false };
}

async function checkRepo() {
	let		i = 0, st = false;

	while (i < students.length)
	{
		//console.log(students[i]);
		Grader.reset();

		let check = await checkLastUpdate(students[i])

		if (check.status)
		{
			st = true;
			console.log("GITLAB_FILES: ", global.GITLAB_FILES[0]);
			//fs.appendFileSync('LOG', `${check.date}    Project: ${students[i].projectId} Username: ${students[i].userName}\n`);
			let task1 = await http.getRepoFile(students[i].projectId, global.GITLAB_FILES[0]);
			let task2 = await http.getRepoFile(students[i].projectId, global.GITLAB_FILES[1]);
			
			if (task1)
				fs.writeFileSync('./framework/user_task1.c', task1);
			if (task2)
				fs.writeFileSync('./framework/user_task2.c', task2);
			
			if (task1 || task2) 
			{
				Grader.variant = students[i].taskVariant;
				await Grader.run();
				let trace = Grader.getTrace();
				let result = `Вы загрузили новые данные студент ${students[i].userName}\t Дата загрузки: ${students[i].lastUpdate} \n ${trace}\n`;
				
				zulip.sendMessage({
					to: `${students[i].userName}@miem.hse.ru`,
					type: "private",
					content: result
				});
			}
		}
		i++;
	}
	if (st)
		fs.writeFileSync("./" + global.GITLAB_STUDENTS_INFO, JSON.stringify({students}));
}

async function run() {

	console.log(students);
	if (students)
	{
		await http.createProjectsForUsers(students);
		fs.writeFileSync("./" + global.GITLAB_STUDENTS_INFO, JSON.stringify({students}));
		let id = setInterval(checkRepo, 5000);
	}

	// let content = await http.getRepoFile(58, 'test');
	// console.log("CONETN: ", content);

	//http.deleteProject(58);
}

//run();

classroom.createCourseWork();
