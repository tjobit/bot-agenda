require("better-logging")(console);
const utils = require("./utils");
const formEmbedCreator = require("./formEmbedCreator");
const syncDB = require("./syncDB");

/**
 * Modifie la db et l'embed correspondant au devoir
 * @param db le contenu de la db
 * @param msg le message originel
 */
const modifDb = async (db, msg, botClient) => {

	console.info("Modification d'un devoir");

	const id = msg.channel.id;
	const groupID = utils.getGroupByID(db.groups, id);
	if (groupID == -1) {
		console.warn("ID du salon inexistant dans la base");
		utils.tempMsg("Ce salon n'est pas un agenda (!help-agenda)", msg.channel);
		return;
	}

	// Si aucun devoir n'a été ajouté
	if (Object.keys(db.groups[groupID].devoirs).length == 0) {
		console.warn("Aucun devoirs présents pour ce groupe");
		utils.tempMsg("Aucun devoir dans l'agenda", msg.channel);
		return;
	}

	const modifMsg = await utils.getResponse(msg, "Quel devoir voulez-vous modifier ?","(numéro du devoir)");
	let numeroValide = false;
	let modif = modifMsg[0].content;

	db.groups[groupID].devoirs.forEach(element => {
		if(element.numéro == modif)
			numeroValide = true;
	});
	
	modifMsg[0].delete();
	modifMsg[1].delete();

	if(!numeroValide){
		utils.tempMsg("Ce numéro de devoir n'existe pas", msg.channel, 2000);
		return;
	}

	
	let formResult = await formEmbedCreator.formEmbed(msg, db);
	
	for (let i = 0; i < db.groups[groupID].devoirs.length; i++) {
		if (db.groups[groupID].devoirs[i].numéro == modif) {
			const embedID = db.groups[groupID].devoirs[i].embedId;

			// Suppression du devoir a modifier dans la bd
			db.groups[groupID].devoirs.splice(i, 1);

			// Rajout du nouveau devoir dans la bd
			db.groups[groupID].devoirs.push({
				"embedId": embedID,
				"matière": formResult.embed.title,
				"numéro": parseInt(formResult.embed.footer.text),
				"date": formResult.embed.fields[0].value,
				"intitulé": formResult.embed.fields[1].value,
				"jours": parseInt(formResult.jour),
			});

			utils.tempMsg(`Devoir ${modif} modifié !`, msg.channel, 2);
		}
	}
	
	utils.updateDbFile(db);

	console.info("Devoir modifié");

	syncDB.syncDB(db, botClient);

};

exports.modifDB = modifDb;