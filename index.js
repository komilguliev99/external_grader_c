/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-23 11:46:10
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-02-11 01:27:57
 * @ Description:
 */


const	http = require('./gitlab_scripts/http');
const	fs = require('fs');
const	global = require('./configs/global');
const	Grader = require('./grader_scripts/components/Grader');
const	lib = require('./lib');
const	zulip = require('./gitlab_scripts/zulip');
const	classroom = require('./google_scripts/classroom');

var			VARIANTS = JSON.parse(fs.readFileSync(`${global.GRADER.PATH}taskVariants.json`)).variants;

const	confFile = JSON.parse(fs.readFileSync("./" + global.GITLAB_STUDENTS_INFO));
const	students = confFile.students;

console.log(confFile);
classroom.setCourseId(confFile.courseId);
classroom.setCourseWorkId(confFile.courseWorkId);

console.log(classroom.courseId);
console.log(classroom.courseWorkId);

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
		return { status: false };
	}
	return { status: false };
}

async function checkRepo() {
	let		i = 0, st = false;
	let		variant;
	let		taskCount = 0;
	let		tasks = [];

	while (i < students.length)
	{
		//console.log(students[i]);
		Grader.reset();

		let check = await checkLastUpdate(students[i])
		variant = students[i].taskVariant;
		taskCount = VARIANTS.taskCounts[variant - 1];
		let	email = students[i].gmail;
		if (check.status)
		{
			st = true;
			//console.log("GITLAB_FILES: ", global.GITLAB_FILES[0]);
			
			let		j = 0;
			while (j < taskCount)
			{
				let		content = await http.getRepoFile(students[i].projectId, `code${++j}.c`);
				if (content)
					tasks.push(content);
			}
			
			if (tasks.length > 0) 
			{
				Grader.variant = variant;
				Grader.taskFiles = tasks;
				Grader.taskCount = taskCount;
				Grader.types = VARIANTS.types[variant - 1];
				Grader.weights = VARIANTS.weights[variant - 1];
				await Grader.run();
				let trace = Grader.getTrace();
				let result = `Вы загрузили новые данные студент ${students[i].userName}\t Дата загрузки: ${students[i].lastUpdate} \n\n ${trace}\n`;
				result = result + "```Оценка за работу: " + Grader.getAssignedGrade() + "```";
				
				console.log(result);
				zulip.sendMessage({
					to: `kzguliev@miem.hse.ru`,
					type: "private",
					content: result
				});

				classroom.setGrade(email, Grader.getAssignedGrade());
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
		//await http.createProjectsForUsers(students);
		//fs.writeFileSync("./" + global.GITLAB_STUDENTS_INFO, JSON.stringify({students}));
		let id = setInterval(checkRepo, 5000);
	}

	// let content = await http.getRepoFile(58, 'test');
	// console.log("CONETN: ", content);

	//http.deleteProject(58);
}

run();

