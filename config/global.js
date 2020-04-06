/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-23 21:41:30
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-06 00:12:54
 * @ Description:
 */

const		fs = require('fs');

var			global = null;

function	config_init()
{
	let		content = fs.readFileSync("./config/configs.json");
	if (!content)
	{
		console.log("No cofiguration!");
		console.log("Please, check your configuration, then restart service!");
	}
	else
		global = JSON.parse(content);
}

config_init();

module.exports = global;