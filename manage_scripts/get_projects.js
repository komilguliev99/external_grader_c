/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-03-30 15:04:20
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-03-30 15:06:12
 * @ Description:
 */


const		http = require('../gitlab_scripts/http');
const		args = process.argv.slice(2);

function			setFlags(flags = {})
{
	let		i = 0;
	while (i < args.length)
	{
		let		item = args[i].split('=');

		switch (val)
		{
			case '--gmail' && item[1]:
				flags.gmail = item[1];
				break ;
			case '--task-variant' && items[1]:
				flags.taskVariant = item[1];
				break ;
			case '--task-type' && item[1]:
				flags.taskType = item[1];
				break ;
			case '--group' && item[1]:
				flags.group = item[1];
				break ;
			case '--course-id' && item[1]:
				flags.courseId = item[1];
				vreak ;
			case '--git-prefix' && item[1]:
				flags.gitPrefix = item[1];
				break ;
			case '--pr-ids' && item[1]:
				flags.prIds = item[1].split(' ');
				break ;
			case '--cw-title' && item[1]:
				flags.cwTitle = item[1];
				break ;
			case '--cw-ids' && item[1]:
				flags.cwIds = item[1].split(' ');
				break ;
			case '--active':
				flags.active = 1;
				break ;
			case '--not-active':
				flags.active = 0;
				break ;
			case '--all':
				flags.all = 1;
				break ;
		}
		i++;	
	}
}

async function		getProjects()
{
	const		flags = {};

	// setting flags
	setFlags(flags);
}