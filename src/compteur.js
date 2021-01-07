require("better-logging")(console);
const utils = require("./utils");
const embed = require("./embeds");

const majDevoirs = (db, botClient) => {
	for (let i = 0; i < db.groups.length; i++) {
		for (let j = 0; j < db.groups[i].devoirs.length; j++) {

			botClient.channels.fetch(db.groups[i].channelId)
				.then(channel => {
					channel.messages.fetch(db.groups[i].devoirs[j].embedId)
						.then(message => {
							if (message.embeds[0]) {
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
						}).catch(() => {
							console.warn("[majDevoir] Embed non trouvé");
							// console.log(e);
						});
				}).catch(() => {
					console.error("[majDevoir] Le salon na pas été trouvé");
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
	const splitArr = dateDevoir.split("/");
	const dayDevoir = parseInt(splitArr[0]);
	const monthDevoir = parseInt(splitArr[1]);
	dateDevoir = new Date(2021, monthDevoir - 1, dayDevoir + 1);

	return datediff(today, dateDevoir);
};

function datediff(first, second) {
	// Take the difference between the dates and divide by milliseconds per day.
	// Round to nearest whole number to deal with DST.
	return Math.round((second - first) / (1000 * 60 * 60 * 24));
}

async function rappel(db, msg) {
	for (let i = 0; i < db.groups.length; i++) {
		for (let j = 0; j < db.groups[i].devoirs.length; j++) {
			if (db.groups[i].devoirs[j].jours === 1) {
				const embedID = db.groups[i].devoirs[j].embedId;
				msg.channel.messages.fetch(embedID)
					.then(embed => {
						embed.delete();
					}).catch(e => {
						console.error(e);
					});
				const finalEmbed = embed.devoirEmbed(
					db.groups[i].devoirs[j].matière, 
					db.groups[i].devoirs[j].date,
					db.groups[i].devoirs[j].intitulé,
					msg.author.username, db.groups[i].devoirs[j].numéro
				);

				finalEmbed.setColor("#ff5b4f");
				finalEmbed.fields[2].value = "Pour demain";

				const msgFinalEmbed = await msg.channel.send(finalEmbed);
		
				const msgFinalEmbedId = msgFinalEmbed.id;
				db.groups[i].devoirs[j].embedId = msgFinalEmbedId;
				

				utils.updateDbFile(db);
			}
		}

	}
}

exports.rappel = rappel;
exports.compteur = compteur;
exports.majDevoirs = majDevoirs;
