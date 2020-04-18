/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-24 12:56:54
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-10 22:56:50
 * @ Description:
 */

const zulip = require('zulip-js');
const path = require('path');
const lib = require('../config/lib');
const global = require('../config/global');
const zuliprc = path.resolve(__dirname, 'zuliprc');
const { getProjects } = require('../manage_scripts/get_projects');
const { createProjects } = require('../manage_scripts/create_projects');
const { deleteProjects } = require('../manage_scripts/delete_projects');
const { addAdmin } = require('../manage_scripts/add_admin');
const gitlab = require('../gitlab_scripts/gitlab');
const fs = require('fs');
 

var		zlp = {
	sendMessage: function (params)
	{
		zulip({ zuliprc }).then(zulip => {
		  	  
			  zulip.messages.send(params).then(console.log);
		});
	}
}

const		CMD = {
	cmds: {
		'get': ['--gmail', '--group', '--git-prefix', '--pr-ids', '--cw-title',
			'--cw-ids', '--active', '--not-active', '--all', '--ignore',
			'--task-variant', '--no-prid', '--no-course', '--no-cw'],
		'create': ['--gmail', '--group', '--git-prefix', '--cw-title',
			'--cw-id', '--task-variant'],
		'delete': ['--gmail', '--group', '--git-prefix', '--pr-ids', '--cw-title',
			'--cw-ids', '--active', '--not-active', '--all', '--ignore', '--no-prid', 
			'--no-course', '--no-cw'],
		'add-admin': ['email'],
		'test': []
	},

	isCmd: function (cmd)
	{
		return this.cmds[cmd];
	},

	getLine: function (blk, email, group, title, projectId, space)
	{
		let		line = '';

		let		i = space + blk.email - email.length;
		console.log(i);
		line = lib.addCharCnt(line, ' ', i);
		line += email;

		i = space + blk.group - group.length;
		line = lib.addCharCnt(line, ' ', i);
		line += group;

		i = space +  blk.title - title.length;
		line = lib.addCharCnt(line, ' ', i);
		line += title;

		i = space +  blk.id - projectId.length;
		line = lib.addCharCnt(line, ' ', i);
		line += projectId;

		line += '\n';
		return line;
	},

	getBlocks: function (prs)
	{
		const 	blk = {};

		prs.forEach(el => {	
			el.projectId = el.projectId.toString();
			if (!blk['email'] || blk['email'] < el.gmail.length)
				blk['email'] = el.gmail.length;
			
			if (!blk['group'] || blk['group'] < el.group.length)
				blk['group'] = el.group.length;

			if (!blk['title'] || blk['title'] < el.cwTitle.length)
				blk['title'] = el.cwTitle.length;
			
			if (!blk['id'] || blk['id'] < el.projectId.length)
				blk['id'] = el.projectId.length;
		});

		return blk;
	},
	
	getFormat: function (prs)
	{
		let		content = '```\n', space = 2;
		let		blk = this.getBlocks(prs);

		console.log("BLK: ", blk);

		if (blk.group < 6)
			blk.group = 6;
		if (blk.title < 8)
			blk.title = 8;

		content += this.getLine(blk, "EMAIL", "ГРУППА",
				"НАЗВАНИЕ", "ID", space);

		prs.forEach(el => {
			let		i = space + blk.email - el.gmail.length;
			console.log(i);
			content = lib.addCharCnt(content, ' ', i);
			content += el.gmail;

			i = space + blk.group - el.group.length;
			content = lib.addCharCnt(content, ' ', i);
			content += el.group;

			i = space +  blk.title - el.cwTitle.length;
			content = lib.addCharCnt(content, ' ', i);
			content += el.cwTitle;

			i = space +  blk.id - el.projectId.length;
			content = lib.addCharCnt(content, ' ', i);
			content += el.projectId;

			content += '\n';
		});
		content += '```';

		return content;
	},

	'get': async function (args, msg)
	{
		try {
			let		res = await getProjects(args.slice(1));
			let		title = 'Список существующых задач:\n';
			if (res)
			{
				if (res.length)
				{
					let		title = 'Список существующых задач:\n';
					return title + this.getFormat(res);
				}
				return "Не найдено задачи с такими параметрами!";
			}
			else
				throw "Error";
		}
		catch {
			return "В ходе обработки произошла ошибка!";
		}
	},

	'create': async function (args, msg)
	{
		try {
			let		res = await createProjects(args.slice(1));
			let		content = '';
			if (res)
			{
				if (res.success.length)
				{
					content += 'Было создано ряд задач:\n';
					content += this.getFormat(res.success);
				}
				if (res.fail.length)
				{
					content += '\nНе получилось создать задачи для студентов:\n';
					res.fail.forEach(el => content += `**${el.gmail}**\n`);
				}
				return content;
			}
			else
				throw "Error";
		}
		catch {
			return "В ходе обработки произошла ошибка!";
		}
	},

	'delete': async function (args, msg)
	{
		try {
			let		res = await deleteProjects(args.slice(1));
			let		title = 'Было удалено ряд задач:\n';
			if (res)
			{
				if (res.length)
				{
					let		title = 'Было удалено ряд задач:\n';
					return title + this.getFormat(res);
				}
				else
					return "Не найдено ни одного проекта с такими парамерами!\n";
			}
			else
				throw "Error";
		}
		catch {
			return "В ходе обработки произошла ошибка!";
		}
	},

	'add-admin': async function (args, msg)
	{
		let		newEmail = args[2].split(':')[1];

		newEmail = newEmail.slice(0, newEmail.length - 1);
		addAdmin(newEmail);
		return `Был добавлен новый админ с eamil ${newEmail}`;
	},

	'test': async function (args, msg, email)
	{
		let	message = "--gmail=c.grader2@miem.hse.ru --task-variant=1";
		let { success: projects } = await createProjects(message.split(' '));
		message = "Был создан проект с параметрами " + message + '\n';

		console.log(projects);

		const	params = {
			to: email,
			type: "private",
			content: message
		};
		zlp.sendMessage({ ...params });

		let task1 = fs.readFileSync('gitlab_scripts/examples/code1.c').toString();
		let task2 = fs.readFileSync('gitlab_scripts/examples/code2.c').toString();

		await lib.sleep(7000);
		params.content = "Было загружено новые работы!";
		zlp.sendMessage({ ...params });

		await this.upload(task1, 'code1.c', projects[0].projectId);
		await lib.sleep(1000);
		await this.upload(task2, 'code2.c', projects[0].projectId);
	},

	upload: async function (content, path, projectId)
	{
		await gitlab.uploadFile({
			content,
			projectId,
			path
		});
	}
}

function			isAdmin(email)
{
	let			i  = 0;
	let			admins = global.admins;

	while (i < admins.length)
	{
		if (admins[i].email == email)
			return true;
		i++;
	}
	return false;
}

var 	lastMessage = null;

async function		handleCmd(msg, email)
{
	let		args = msg.split(' ');
	let		content = null;

	if (CMD.isCmd(args[0]))
	{
		msg = msg.slice(args[0].length);
		content = CMD[args[0]](args, msg, email);
	}
	else if (isAdmin(email))
	{
		content = 'Вам доступны следующие команды:\n';
		Object.keys(CMD.cmds).forEach(el => {
			content += `* **${el}:**\n`;
			CMD.cmds[el].forEach(it => {
				content += `  * ${it}\n`
			})
		});
	}
	else
		content = 'Вам недоступна ни одна команда.';
	return content;
}

async function		messageHandler(data)
{
	if (data.result != 'success')
	{
		console.log("There is an error!")
		return ;
	}
	else if (data.messages.length && lastMessage != data.messages[0].id &&
			isAdmin(data.messages[0].sender_email) && 
			data.messages[0].sender_id != 519)
	{
		let		message = data.messages[0].content;
		console.log("MESSAGE: ", message);
		if (message)
		{
			message = message.slice(3, message.length - 4);
			message = message.trim()

			const	params = {
				to: data.messages[0].sender_email,
				type: "private",
				content: `Ваш запрос обрабатывается...`
			};

			zlp.sendMessage({ ...params });

			params.content = await handleCmd(message, data.messages[0].sender_email);
			zlp.sendMessage(params);
		}
		lastMessage = data.messages[0].id;
	}
	else
		console.log("ME!");

}

async function		listenMessage(zulip)
{
	const readParams = {
		'anchor': 100000000,
        'num_before': 1,
        'num_after': 0,
	};
	
	zulip.messages.retrieve(readParams).then(messageHandler);

	await lib.sleep(1000);
	listenMessage(zulip);
}

zulip({ zuliprc }).then(async function (zulip){

    // Fetch messages anchored around id (1 before, 1 after)
	listenMessage(zulip);

})

module.exports = zlp;