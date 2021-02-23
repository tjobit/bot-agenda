require("better-logging")(console);
const utils = require("./utils");
const formEmbedCreator = require("./formEmbedCreator");
const syncDB = require("./syncDB");

let formUsed = false;
/**
 * Ajoute un devoir dans la base de donnée à partir d'un equestionnaire 
 * @param db le contenu de la base de donnée
 * @param msg le message d'origine
 */
const ajoutDb = async (db, msg, botClient) => {
	//if(formUsed){
		//utils.tempMsg("Quelqu'un est déjà en train d'ajouter un devoir, attends un peu.", msg.channel);
		//return;
	//}
	formUsed = true;
	console.info("Ajout d'un devoir");

	const id = msg.channel.id;
	const groupID = utils.getGroupByID(db.groups, id);

	if (groupID == -1) {
		console.warn("ID du salon inexistant dans la base");
		utils.tempMsg("Ce salon n'est pas un agenda (!help-agenda)", msg.channel);
		return;
	}
	
	let formResult = await formEmbedCreator.formEmbed(msg, db);

	db.groups[groupID].devoirs.push({
		"embedId": null,
		"matière": formResult.embed.title,
		"numéro": parseInt(formResult.embed.footer.text),
		"date": formResult.embed.fields[0].value,
		"intitulé": formResult.embed.fields[1].value,
		"jours": parseInt(formResult.jour),
	});

	utils.updateDbFile(db);

	console.info("Devoir ajouté");

	syncDB.syncDB(db,botClient);
	formUsed = false;
};

exports.ajoutDb = ajoutDb;
