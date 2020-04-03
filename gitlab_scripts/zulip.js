/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-24 12:56:54
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-03 14:38:18
 * @ Description:
 */

const zulip = require('zulip-js');
const path = require('path');
const lib = require('../lib');
const global = require('../configs/global');
const zuliprc = path.resolve(__dirname, 'zuliprc');

var		zlp = {
	sendMessage: function (params)
	{
		zulip({ zuliprc }).then(zulip => {
		  	  
			  zulip.messages.send(params).then(console.log);
		});
	}
}

async function		messageHandler(data)
{
	if (data.result != 'success')
	{
		console.log("There is an error!")
		return ;
	}
	else if (data.messages.length && global.ADMIN.EMAIL == data.messages[0].sender_email)
	{
		let		content = data.messages[0].content;
		content = content.slice(3, 5);
		console.log(content);
	}

}

async function		listenMessage(zulip)
{
	const readParams = {
		'anchor': 100000000,
        'num_before': 1,
        'num_after': 0,
	};
	
	zulip.messages.retrieve(readParams).then(messageHandler);

	await lib.sleep(5000);
	listenMessage(zulip);
}

zulip({ zuliprc }).then(zulip => {

    // Fetch messages anchored around id (1 before, 1 after)
	listenMessage(zulip);

})

module.exports = zlp;