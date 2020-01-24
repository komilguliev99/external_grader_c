/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-23 11:46:10
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-01-23 23:14:45
 * @ Description:
 */


var http = require('./gitlab_scripts/http');
var fs = require('fs');
var global = require('./configs/global');

var students = fs.readFileSync("./" + global.GITLAB_STUDENTS_INFO);
students = JSON.parse(students).students;
console.log(students);

async function checkLastUpdate(student)
{
	//console.log("BEFORE CHECKING: ", student);
	let commits = await http.commitList(student.projectId);
	let lastUpdate;
	if (commits && commits.length > 0)
	{
		console.log(commits);
		lastUpdate = commits[0]['committed_date'];

		console.log("LAST: ", lastUpdate);
		if (lastUpdate && (!student.lastUpdate || new Date(student.lastUpdate) < new Date(lastUpdate)))
		{
			console.log("ENTERED");
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
	let		i = 0;

	while (i < students.length)
	{
		console.log(students[i]);

		let check = await checkLastUpdate(students[i])
		//console.log("AFFFFFFFFFFFFFFFFFFFFFFFFFFFTER: ", check);

		if (check.status)
			fs.appendFileSync('LOG', `${check.date}    Project: ${students[i].projectId} Username: ${students[i].userName}\n`);
		i++;
	}
	fs.writeFileSync('students.json', JSON.stringify({students}));
}

async function run() {

	// console.log(students);
	// if (students)
	// {
	// 	await http.createProjectsForUsers(students);
	// 	let id = setInterval(checkRepo, 5000);
	// }

	let content = await http.getRepoFile(58, 'test');
	console.log("CONETN: ", content);
}

run();

