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

const libelleJour = (jours) => {
	if(jours === 0)
		return "Pour aujourd'hui";
	if(jours === 1)
		return "Pour demain";
	if(jours === 2)
		return "Pour après-demain";	
	if(jours === 7)
		return "Pour dans une semaine";
	if(jours >= 28 && jours < 250)
		return "Pour dans un mois";
	if(jours >= 250)
		return "Pour dans trop longtemps (tu t'es pas trompé de date ?)";
	return jours + " jours";
};

exports.getGroupByID = getGroupByID;
exports.tempMsg = tempMsg;
exports.updateDbFile = updateDbFile;
exports.debugDbFile = debugDbFile;
exports.clearDbFile = clearDbFile;
exports.getResponse = getResponse;
exports.dateValide = dateValide;
exports.trouverMatière = trouverMatière;
exports.libelleJour = libelleJour;