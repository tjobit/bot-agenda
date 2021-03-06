require("better-logging")(console);
const Discord = require("discord.js");
const utils = require("./utils");

/**
 * Création de l'embed pour l'affichage des devoirs
 * @param matiere nom de la matière donnée
 * @param date numéro de la date donnée (XX/XX)
 * @param intitule nom de l'intitulé du devoir donné
 * @param auteur nom de la personna ayant crée le devoir
 * @param numDevoir numéro du devoir dans la db
 * @return l'embed mis en forme
 */
const devoirEmbed = (matiere, date, intitule, numDevoir, jours) => {
	let couleur = "#FFFF00";

	if(jours == 0){
		couleur = "#ff5b4f";
	} else if(jours == 1){
		couleur = "#ff9b21";
	}

	
	
	const exampleEmbed = new Discord.MessageEmbed()
		.setTitle(matiere)
		.setURL(utils.getURL(matiere))
		.addFields(
			{ name: "Date de remise :", value: date },
			{ name: "Devoir :", value: intitule },
			{ name: "Temps restant avant remise :", value: utils.libelleJour(jours) }
		)
		.setColor(couleur)
		.setFooter(numDevoir)
		.setTimestamp();
	return exampleEmbed;
	
};

/**
 * Création de l'embed pour l'affichage du !help-agenda
 * @return l'embed mis en forme
 */
const helpEmbed = () => {
	const exampleEmbed = new Discord.MessageEmbed().setTitle("Aide BotAgenda")
		.addFields(
			{ name: "Initialiser agenda (Obligatoire) :", value: "!init-agenda" },
			{ name: "Ajouter un devoir :", value: "!agenda" },
			{ name: "Supprimer un devoir :", value: "!suppr-agenda" },
			{ name: "Modifier un devoir :", value: "!modif-agenda" },
		)
		.setColor("#FFFF00");
	return exampleEmbed;
};

/**
 * Création de l'embed pour l'affichage des questions
 * @param question la question posée a l'utilisateur
 * @param footer contenu du footer voulu
 * @return l'embed mis en forme
 */
const questionEmbed = (question, footer = null) => {
	const exampleEmbed = new Discord.MessageEmbed().setTitle(question)
		.setColor("#133e47");

	if (footer != null)
		exampleEmbed.setFooter(footer);
	return exampleEmbed;
};

exports.devoirEmbed = devoirEmbed;
exports.helpEmbed = helpEmbed;
exports.questionEmbed = questionEmbed;
