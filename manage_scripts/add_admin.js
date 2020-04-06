/**
 * @ Author: Komil Guliev
 * @ Create Time: 2020-04-04 16:03:50
 * @ Modified by: Komil Guliev
 * @ Modified time: 2020-04-06 00:18:09
 * @ Description:
 */

const       gitlab  = require('../gitlab_scripts/gitlab');
const       gl  = require('../config/global');

module.exports.addAdmin = async function (email)
{
    let admins = [];
    let id =gl.external_configs.id;
    let path = gl.external_configs.admins;

    admins.push({ email });

    let content = JSON.parse(await gitlab.getRepoFile(id, path));
    
    console.log("CONTENT: ", content);
    if (content && content.admins)
        admins = admins.concat(content.admins);
    
    gl.admins.push({ email });
        
    if (content)
    {
        let     params = {
                    branch: 'master',
                    content: JSON.stringify({ admins }),
                    'commit_message': 'added new admin'
                };
        await gitlab.put(`/projects/${id}/repository/files/${path}`, params);
    }
    else
        await gitlab.uploadFile({ content: JSON.stringify({ admins }), path, projectId: id });
}