require("better-logging")(console);
const embed = require("./embeds");
const fs = require("fs");
const matDB = require("./matieres.json");

/**
 * Retourne la position d'un groupe dans le tableau groups de la db
 * @param groups correspond à db.groups
 * @param id l'id a chercher dans la db (-1 si non trouvé)
 * @return la position du groupe dans la db si l'id donné existe, sinon return -1 
 */
const getGroupByID = (groups, id) => {
	for (let i = 0; i < groups.length; i++) {
		if (groups[i].channelId == id)
			return i;
	}
	return -1;
};

/**
 * Affiche le message donné, puis le supprime après 5sec
 * @param content le contenu du message a envoyer
 * @param channel dans lequel va être envoyé le message
 * @param time le temps avant que le message soit supprimé en ms (facultatif)
 */
const tempMsg = (content, channel, time = 5000) => {
	channel.send(embed.questionEmbed(content)).then(botMsg => {
		botMsg.delete({ timeout: time });
	});
};

/**
 * Pose une question à l'utilisateur via Discord et renvois sa reponse ainsi que le message du bot comprenant la question
 * @param msg le message d'origine
 * @param question Le text de la question que le bot posera
 * @param help un message en dessous de la question (facultatif)
 * @param questionMsgList 
 * @return la premesse qui resoud un tableau de deux elements : [Reponse utilisateur , Message du bot comprenent la question]
 */
const getResponse = async (msg, question, help = null, questionMsgList = null) => {
	let questMsg = await msg.channel.send(embed.questionEmbed(question, help)).catch(e => { console.error(e); });
	return new Promise(
		function (resolve) {
			const filter = m => m.author.id === msg.author.id;
			msg.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ["time"] })
				.then(collected => {
					resolve([collected.first(), questMsg]);
					questMsg.edit(embed.questionEmbed(question, trouverMatière(collected.first().content)));
				})
				.catch(() => {
					console.warn("Question timeout");
					tempMsg("Annulation : temps de réponse trop long", msg.channel, 2);
					if (questMsg)
						questMsg.delete();
					if (questionMsgList != null) {
						//On supprime tous les messages contenant les questions
						questionMsgList.forEach(element => {
							element.delete().catch(() => console.debug("Message de question déjà supprimé"));
						});
					}
				});
		}
	);
};

/**
 * Met a jour la db
 * @param db le contenu du fichier a mettre a jour
 */
const updateDbFile = (db) => {
	try {
		fs.writeFileSync("./src/devoirs.json", JSON.stringify(db));
	} catch (e) {
		console.error("Impossible de mettre à jour le fichier de la base");
	}

	if (db.groups.length > 0)
		fs.writeFileSync("./src/db.back", JSON.stringify(db));

	console.info("Fichier mit à jour");
};

/**
 * Affiche le contenu de la db
 * @param db le contenu du fichier a mettre a jour
 * @param msg le message d'origine
 */
const debugDbFile = (db, msg) => {
	msg.reply("```" + JSON.stringify(db, null, 4) + "```").catch(() => { console.log(" DB trop grande "); });
	msg.delete();
	console.info("Discord debug");
};

/**
 * Ecrase le contenu de la db par un tableau groups vierge
 * @param db le contenu du fichier a mettre a jour
 * @param msg le message d'origine
 * @return db modifié
 */
const clearDbFile = (db, msg) => {
	msg.delete();
	// eslint-disable-next-line quotes
	db = JSON.parse('{ "groups": [] }');
	updateDbFile(db);
	console.warn("DATABASE RESET");
	return db;
};

/**
 * Verifie la validité de la date
 * @param date la date a vérifier
 * @return false si la date n'est pas valide, sinon true
 */
const dateValide = (date) => {
	if (date.length !== 5)
		return false;

	const splitArr = date.split("/");
	if (splitArr.length !== 2)
		return false;

	if (+splitArr[0] !== parseInt(splitArr[0]))
		return false;

	if (+splitArr[1] !== parseInt(splitArr[1]))
		return false;

	if (parseInt(splitArr[0]) > 31 || parseInt(splitArr[0]) <= 0)
		return false;

	if (parseInt(splitArr[1]) > 12 || parseInt(splitArr[1]) <= 0)
		return false;

	return true;
};

/**
 * Corrige le nom de la matière si trouvé dans le fichier 
 * @param source le message a corriger 
 * @return le nom de la matière corrigé si trouvé, sinon return le message original
 */
const trouverMatière = (source) => {
	matDB.matières.forEach(mat => {
		mat.alias.forEach(alias => {
			if (source.toUpperCase().includes(alias.toUpperCase())) {
				source = mat.nom;
			}
		});
	});
	return source;
};

/**
 * Remplace le nombre de jours par une string selon certaines conditions
 * @param jours le nombre de jours avant la remise
 * @return un libellé particulier si le nombre de jour correspond a un nombre particulier, sinon return le nombre de jours
 */
const libelleJour = (jours) => {
	if (jours === 0)
		return "Pour aujourd'hui";
	else if (jours === 1)
		return "Pour demain";
	else if (jours === 2)
		return "Pour après-demain";	
	else if (jours === 7)
		return "Pour dans une semaine";
	else if (jours >= 30 && jours < 30*2)
		return "Pour dans 1 mois";
	else if (jours >= (30*2) && jours < (30*3))
		return "Pour dans 2 mois";
	else if (jours >= (30*3) && jours < (30*4))
		return "Pour dans 3 mois";
	else if (jours >= (30*4) && jours < (30*5))
		return "Pour dans 4 mois";
	else if (jours >= (30*5) && jours < (30*6))
		return "Pour dans 5 mois";
	else if (jours >= (30*6) && jours < (30*7))
		return "Pour dans 6 mois";
	else if (jours >= (30*7) && jours <= (30*8))
		return "Pour dans 7 mois";
	else if (jours > 240)
		return "Pour dans trop longtemps (tu t'es pas trompé de date ?)";
	else
		return `Pour dans ${jours} jours`;
};


/**
 * Recupere l'url donné pour chaque matière dans son json si il est indiqué 
 * @param matiere le nom de la matière 
 * @return le lien moodle affilié à la matière si il existe sinon return le lien du tableau de bord moodle
 */
const getURL = (matiere) => {
	for(let i = 0; i < matDB.matières.length; i++) {
		if(matDB.matières[i].nom == matiere && matDB.matières[i].url)
			return matDB.matières[i].url;
	}
	return "https://moodle1.u-bordeaux.fr/my/";
};

exports.getURL = getURL;
exports.getGroupByID = getGroupByID;
exports.tempMsg = tempMsg;
exports.updateDbFile = updateDbFile;
exports.debugDbFile = debugDbFile;
exports.clearDbFile = clearDbFile;
exports.getResponse = getResponse;
exports.dateValide = dateValide;
exports.trouverMatière = trouverMatière;
exports.libelleJour = libelleJour;