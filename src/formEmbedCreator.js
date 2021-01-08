require("better-logging")(console);
const utils = require("./utils");
const embed = require("./embeds");

/**
 * Lance le questionnaire de création du formulaire
 * @param msg le message d'origine
 * @param groupsArr db.groups[?]
 */
const formEmbed = async (msg, devoirs) => {

	console.log(">=======[FORM]=======");

	//Tableau contenant l'ensemble des messages de questions du bot
	let questionsMsgList = [];

	//Demande de la matière
	const matiereQuestionResults = await utils.getResponse(msg, "Dans quelle matière souhaitez vous ajouter ce devoir ?");
	const matiere = utils.trouverMatière(matiereQuestionResults[0].content);
	console.log(">matiere : " + matiere);
	matiereQuestionResults[0].delete();
	questionsMsgList.push(matiereQuestionResults[1]);

	//Demande de l'intitulé
	const intituleQuestionResults = await utils.getResponse(msg, "Quel est l'intitulé du devoir ?");
	const intitule = intituleQuestionResults[0].content;
	console.log(">intitulé : " + intitule);
	intituleQuestionResults[0].delete();
	questionsMsgList.push(intituleQuestionResults[1]);

	//Demande de la date (attend que la date soit valide et redemande tant que ce n'est pas le cas)
	let date = "_";
	let dateQuestionResults = null;
	let erreurDate = false;
	while (!utils.dateValide(date)) {
		if (erreurDate)
			dateQuestionResults[1].delete().catch(() => console.warn("Message de la question de date déjà supprimé"));

		dateQuestionResults = await utils.getResponse(
			msg, erreurDate ?
				"Date invalide, réssayez avec le bon format (JJ/MM)" :
				"Quel est la date de remise du devoir ? (JJ/MM)"
		);

		date = dateQuestionResults[0].content;
		console.log(">date : " + date);
		dateQuestionResults[0].delete();
		questionsMsgList.push(dateQuestionResults[1]);
		erreurDate = true;
	}

	//On supprime tous les messages contenant les questions
	questionsMsgList.forEach(element => {
		element.delete().catch(() => console.debug("Message de question déjà supprimé"));
	});

	//On recupère le numéro de devoir qui sera assigné à ce nouveau devoir (Utilisé si le frmulaire est la pour une création)
	let numDevoir = getNewDevoirNum(devoirs);

	console.log(">====================");

	//On retourne l'embed final contenant les reponses aux question
	return embed.devoirEmbed(
		matiere,
		date,
		intitule,
		msg.author.username,
		numDevoir
	);
};

/**
 * Calcule le numéro du devoir
 * @param devoirs les devoirs
 * @return le numéro du devoir
 */
const getNewDevoirNum = (devoirs) => {
	let numDevoir = 1;
	for (let i = 0; i < devoirs.length; i++) {
		if (numDevoir <= devoirs[i].numéro)
			numDevoir = devoirs[i].numéro + 1;
	}
	return numDevoir;
};

exports.formEmbed = formEmbed;
exports.getNewDevoirNum = getNewDevoirNum;