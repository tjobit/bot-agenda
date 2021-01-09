require("better-logging")(console);
const utils = require("./utils");

/**
 * Supprime un devoir de la db
 * @param db le contenu du fichier a mettre a jour
 * @param msg le message d'origine
 */
const supprDb = async (db, msg) => {
	const id = msg.channel.id;

	const groupID = utils.getGroupByID(db.groups, id);

	// Si l'agenda n'a pas été initialisé
	if (groupID == -1) {
		console.error("Cet id n'existe pas");
		utils.tempMsg("Ce salon n'est pas un agenda (!help-agenda)", msg.channel);
		return;
	}

	// Si aucun devoir n'a été ajouté
	if (Object.keys(db.groups[groupID].devoirs).length == 0) {
		utils.tempMsg("Aucun devoir dans l'agenda", msg.channel);
		return;
	}

	const supprMsg = await utils.getResponse(msg, "Quel devoir voulez-vous supprimer ? (numéro du devoir)");
	let suppr = supprMsg[0].content;
	supprMsg[0].delete();
	supprMsg[1].delete();

	for (let i = 0; i < db.groups[groupID].devoirs.length; i++) {
		if (db.groups[groupID].devoirs[i].numéro == suppr) {
			
			db.groups[groupID].devoirs.splice(i, 1);
			utils.updateDbFile(db);
			utils.tempMsg(`Devoir ${suppr} supprimé !`, msg.channel);
			return;
		}
	}

	utils.tempMsg("Aucun devoir avec ce numéro dans l'agenda", msg.channel);

	

};

exports.supprDb = supprDb;