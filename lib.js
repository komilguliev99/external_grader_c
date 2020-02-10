/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-01-24 08:01:44
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-01-24 08:05:25
 * @ Description:
 */

 const logPerm = false;

var		lib = {
	rangeRandom: function (min, max) {
		// получить случайное число от (min-0.5) до (max+0.5)
		let rand = min - 0.5 + Math.random() * (max - min + 1);
		return Math.round(rand);
	},
	getFormat: function(number) {
		if (number < 10) return '0' + number;
		return number.toString();
	},
	logOut: function (...logs)
	{
		if (logPerm)
			console.log(...logs);
	}
}

module.exports = lib;