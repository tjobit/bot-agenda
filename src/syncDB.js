require("better-logging")(console);
const utils = require("./utils");
const embed = require("./embeds");
const compteur = require("./compteur");


/**
 * Lance la sync de la db, lit tout le contenu de la db et le compare avec les salons sur discord.
 * La fonction vérifie su un message sur discord doit être ajouté supprimé ou modifié 
 * et se charge donc de syncroniser la bd avec les salons discords
 * @param db la base de donnée
 * @param botClient le client du bot
 */
const syncDB = async (db, botClient) => {
	console.info("Synchronisation de la DB !");

	db.groups.forEach(group => {
		botClient.channels.fetch(group.channelId)
			.then(channel => {
				group.devoirs.forEach(devoir => {
					devoir.jours = compteur.compteur(devoir.date);
					syncDevoir(db, channel, devoir);
				});
			})
			.catch(() => {
				console.error("Salon non trouvé");
			});
	});
};


/**
 * Sync un devoir avec son salon discord
 * @param db la base de donnée
 * @param channel le channel sur lequel le message doit se trouver
 * @param devoir le devoir en question
 */
const syncDevoir = async (db, channel, devoir) => {

	//Embed avec les dernières informations de ce devoir (Tout à jour)
	//Il sera utilisé uniquement si on en a besoin pour edit ou creer un message
	const devoirEmbed = embed.devoirEmbed(devoir.matière, devoir.date, devoir.intitulé, devoir.numéro, devoir.jours);

	if (devoir.embedId == null && devoir.jours >= 0) {
		await channel.send(devoirEmbed)
			.then(msg => {
				console.info(`Message discord du devoir ${devoir.numéro} créé pour la première fois`);
				changeEmbedId(db, devoir.numéro, msg.id);
			})
			.catch(() => console.error(`Impossible de créer le message du devoir ${devoir.numéro}`));
	} else {
		//recherche dans salon
		channel.messages.fetch(devoir.embedId)

			//si je trouve
			.then(msg => {
				// est ce que ce message possède un embed valide ?
				if (!msg.embeds[0]) {
					msg.delete()
						.then(() => {
							console.warn(`Message discord du devoir ${devoir.numéro} supprimé car ce devoir ne comporte plus son embed, il devrait être correctement recréé`);
							messageNonTrouveDansSalonDiscord(db,devoir,channel,devoirEmbed);
						})
						.catch(e => {
							console.error("Delete error");
							console.error(e);
						});
				} else {//Si ce message a toujours son embed
					//Si le devoir à dépassé sa date de validité, on le suppr
					if (devoir.jours < 0) {
						msg.delete()
							.then(() => {
								console.warn(`Message discord du devoir ${devoir.numéro} supprimé du salon et de la db car ce devoir est trop vieux`);
								supprDbSync(db, devoir.numéro);
							})
							.catch(e => { console.error(e); });
						//Si le message doit être mit à jour, soit son embed n'est pas égale à l'embed regénéré
					} else if (embedDiff(msg.embeds[0], devoirEmbed)) {
						msg.edit(devoirEmbed)
							.then(() => {
								console.info(`Message discord du devoir ${devoir.numéro} édité car ses informations n'étaient plus à jour`);
							})
							.catch(e => { console.error(e); });
					}
				}
			})

			//si je trouve pas le message discord
			.catch(() => {
				messageNonTrouveDansSalonDiscord(db,devoir,channel,devoirEmbed);
			});
	}
};


/**
 * Prend en charge le cas ou un message n'est pas trouvé dans un salon discord
 * Si le message doit bien exister alors il est recréé
 * @param db la base de donnée 
 * @param devoir le devoir en question
 * @param channel le channel en question 
 * @param devoirEmbed l'embed correspondant aux devoirs
 */
const messageNonTrouveDansSalonDiscord = (db, devoir, channel, devoirEmbed) => {
	console.warn(`Le devoir ${devoir.numéro} ne correspond à aucun message discord`);
	//Si il doit encore exister
	if (devoir.jours >= 0) {
		channel.send(devoirEmbed)
			.then(msg => {
				console.info(`Message discord du devoir ${devoir.numéro} créé`);
				changeEmbedId(db, devoir.numéro, msg.id);
			})
			.catch(() => console.error(`Impossible de créer le message du devoir ${devoir.numéro}`));
	} else {//Si ce devoir est dans la db mais plus dans le salon et qu'il doit ne plus exister
		if (devoir.jours < 0) {
			console.warn(`Ddevoir ${devoir.numéro} supprimé de la db car ce devoir est trop vieux`);
			supprDbSync(db, devoir.numéro);
		}
	}
};

/**
 * Regarde si deux embeds présentent des différences qui pourraient 
 * justifier une mise à jour de message
 * @param embed1 premier embed a comparer 
 * @param embed2 deuxième embed a comparer
 * @return vrai si les embeds sont différents
 */
const embedDiff = (embed1, embed2) => {
	if (embed1.title != embed2.title)
		return true;
	if (embed1.fields[0].value != embed2.fields[0].value)
		return true;
	if (embed1.fields[1].value != embed2.fields[1].value)
		return true;
	if (embed1.fields[2].value != embed2.fields[2].value)
		return true;
	return false;
};

/**
 * Change l'attribut embedID d'un devoir dans la bd
 * @param db la db
 * @param numeroDev le numero du devoir à changer
 * @param newEmbedID le nouvel id
 */
const changeEmbedId = (db, numeroDev, newEmbedId) => {
	for (let i = 0; i < db.groups.length; i++) {
		for (let j = 0; j < db.groups[i].devoirs.length; j++) {
			if (db.groups[i].devoirs[j].numéro === numeroDev) {
				db.groups[i].devoirs[j].embedId = newEmbedId;
			}
		}
	}
	utils.updateDbFile(db);
};

/**
 * Supprime un devoir dans la bd à partir de son numéro
 * @param db la db
 * @param numeroDev le numero du devoir
 */
const supprDbSync = (db, numeroDev) => {
	for (let i = 0; i < db.groups.length; i++) {
		for (let j = 0; j < db.groups[i].devoirs.length; j++) {
			if (db.groups[i].devoirs[j].numéro == numeroDev) {
				db.groups[i].devoirs.splice(j, 1);
			}
		}
	}
	utils.updateDbFile(db);
};


exports.syncDB = syncDB;