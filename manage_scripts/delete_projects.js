/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-03-19 15:14:42
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-03-25 22:44:29
 * @ Description:
 */

const		http = require('../gitlab_scripts/http');
const		args = process.argv.slice(2);


let		ids = args.length > 0 ? args[0].split('=')[1] : null;

if (ids)
{
	ids = ids.split(' ');
	http.deleteProjects(ids);
}