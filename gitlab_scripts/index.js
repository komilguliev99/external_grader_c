/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   index.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dcapers <dcapers@student.21-school.ru>     +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2020/01/23 11:47:46 by dcapers           #+#    #+#             */
/*   Updated: 2020/01/23 11:47:46 by dcapers          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

var http = require('./http');

user = {
	id: 73,
	username: 'dfan'
};

users = [
	{
		id: 73,
		userName: 'dfan'
	},
	{
		id: 75,
		userName: 'sermatov'
	}
];

let ids = [38, 42, 43, 44, 45, 46, 47];

//http.createProjectsForUsers(users);

http.deleteProject(41);