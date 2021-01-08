require("better-logging")(console);
const utils = require("./utils");
const embed = require("./embeds");


/**
 * Met a jour (dans la db et sur l'embed) le nombre de jours restants pour chaque devoir 
 * @param db le contenu du fichier a mettre a jour
 * @param botClient le bot
 */
const majDevoirs = (db, botClient) => {
	for (let i = 0; i < db.groups.length; i++) {
		for (let j = 0; j < db.groups[i].devoirs.length; j++) {
			console.info("Check group : " + db.groups[i].channelId);
			// On cherche le salon avec son id
			botClient.channels.fetch(db.groups[i].channelId)
				.then(channel => {
					console.info("salon trouvé");
					// On cherche le message avec son id
					channel.messages.fetch(db.groups[i].devoirs[j].embedId)
						.then(message => {
							if (message.embeds[0]) {
								// Si le compteur est différent du nb indiqué dans la db, on le met a jour 
								if (compteur(db.groups[i].devoirs[j].date) !== db.groups[i].devoirs[j].jours) {

									message.embeds[0].fields[2].value = compteur(message.embeds[0].fields[0].value);
									db.groups[i].devoirs[j].jours = compteur(db.groups[i].devoirs[j].date);

									utils.updateDbFile(db);

									message.edit(
										message.embeds[0]
									)
										.then(() => { console.log("Jour restants embed mit à jour"); })
										.catch(() => {
											console.error("[majDevoir] Impossible d'éditer cet embed");
										});
								}
							}

							// Appel de la fonction rappel
							rappel(db, channel, db.groups[i].devoirs[j]);



						}).catch(() => {
							console.warn("[majDevoir] Embed non trouvé");
						});
				}).catch(e => {
					console.error("[majDevoir] Le salon na pas été trouvé");
					console.error(e);
				});
		}
	}
};


/**
 * Compte le nombre de jours entre la date donnée et la date d'ajourd'hui
 * @param date la date du devoir donné
 * @return le nombre de jours restant avant la date de remise
 */
const compteur = (date) => {
	let today = new Date();
	let dateDevoir = date;
	// Crée un tableau de taille 2, à l'index 0 on a le jour et à l'index 1 on a le mois 
	const splitArr = dateDevoir.split("/");
	const dayDevoir = parseInt(splitArr[0]);
	const monthDevoir = parseInt(splitArr[1]);
	dateDevoir = new Date(2021, monthDevoir - 1, dayDevoir + 1);
	return datediff(today, dateDevoir);
};

/**
 * Calcule la difference entre 2 dates
 * @param first premiere date donnée
 * @param second seconde date donnée
 * @return la difference entre first et second en jours
 */
function datediff(first, second) {
	// Take the difference between the dates and divide by milliseconds per day.
	// Round to nearest whole number to deal with DST.
	return Math.round((second - first) / (1000 * 60 * 60 * 24));
}

/**
 * Supprime l'embed original et en crée un nouveau si il rest qu'un jour avant la remise
 * @param db le contenu du fichier a mettre a jour
 * @param channel le channel donné
 * @param devoir le devoir donné
 */
async function rappel(db, channel, devoir) {

	const embedID = devoir.embedId;
	// On cherche le message avec son id
	channel.messages.fetch(embedID)
		.then(embed => {
			// On le supprime
			embed.delete();
		}).catch(e => {
			console.error(e);
		});

	// Création d'un nouvel embed (avec les mêmes values)	
	const finalEmbed = embed.devoirEmbed(
		devoir.matière,
		devoir.date,
		devoir.intitulé,
		"Bot Agenda",
		devoir.numéro
	);

	// Si le nb jour restant est égal à 1 
	if (devoir.jours == 0) {
		finalEmbed.setColor("#ff5b4f");
		finalEmbed.fields[2].value = "Pour aujourd'hui";

	// Si le nb jour restant est égal à 0
	} else if (devoir.jours == 1) {
		finalEmbed.setColor("#ff9b21");
		finalEmbed.fields[2].value = "Pour demain";
	}

	// On envoie l'embed
	const msgFinalEmbed = await channel.send(finalEmbed);

	// On remplace dans db l'id de l'embed supprimé par l'id de celui crée
	const msgFinalEmbedId = msgFinalEmbed.id;
	devoir.embedId = msgFinalEmbedId;

	utils.updateDbFile(db);
}


exports.rappel = rappel;
exports.compteur = compteur;
exports.majDevoirs = majDevoirs;
