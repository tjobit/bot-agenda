require("better-logging")(console);
const utils = require("./utils");
const formEmbedCreator = require("./formEmbedCreator");

/**
 * Ajoute un devoir dans la base de donnée à partir d'un equestionnaire 
 * @param db le contenu de la base de donnée
 * @param msg le message d'origine
 */
const ajoutDb = async (db, msg) => {

	console.info("Ajout d'un devoir");

	const id = msg.channel.id;
	const groupID = utils.getGroupByID(db.groups, id);

	if (groupID == -1) {
		console.warn("ID du salon inexistant dans la base");
		utils.tempMsg("Ce salon n'est pas un agenda (!help-agenda)", msg.channel);
		return;
	}

	let finalEmbed = await formEmbedCreator.formEmbed(msg, db.groups[groupID].devoirs);
	const devoirMsg = await msg.reply(finalEmbed);

	const embedID = devoirMsg.id;

	db.groups[groupID].devoirs.push({
		"embedId": embedID,
		"matière": finalEmbed.title,
		"numéro": parseInt(finalEmbed.footer.text),
		"date": finalEmbed.fields[0].value,
		"intitulé": finalEmbed.fields[1].value,
		"jours": parseInt(finalEmbed.fields[2].value)
	});

	utils.updateDbFile(db);

	console.info("Devoir ajouté");
};

exports.ajoutDb = ajoutDb;