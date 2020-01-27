/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-24 12:56:54
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-01-25 17:40:08
 * @ Description:
 */

const zulip = require('zulip-js');
const path = require('path');
const zuliprc = path.resolve(__dirname, 'zuliprc');

var		zlp = {
	sendMessage: function (params)
	{
		zulip({ zuliprc }).then(zulip => {
		  	  
			  zulip.messages.send(params).then(console.log);
		});
	}
}

module.exports = zlp;