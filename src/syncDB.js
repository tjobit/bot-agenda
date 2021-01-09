require("better-logging")(console);
const utils = require("./utils");
const embed = require("./embeds");

//Lire la db, lire les channels et syncrhoniser les deux
const syncDB = async (db, botClient) => {
	db.groups.forEach(group => {
		botClient.channels.fetch(group.channelId)
			.then(channel => {
				group.devoirs.forEach(devoir => {
					syncDevoir(db, channel, devoir);
				});
			})
			.catch(() => {
				console.error("Salon non trouvé");
			});
	});
};

//Check si existe dans son salon, si il doit etre ajouté ou supr ou edité
const syncDevoir = async (db, channel, devoir) => {

	const devoirEmbed = embed.devoirEmbed(devoir.matière, devoir.date, devoir.intitulé, devoir.numéro);

	if (devoir.embedId == null) {
		await channel.send(devoirEmbed)
			.then(msg => {
				console.info(`Message discord du devoir ${devoir.numéro} créé pour la première fois`);
				changeEmbedId(db, devoir.numéro, msg.id);
			})
			.catch(() => console.error(`Impossible de créer le message du devoir ${devoir.numéro}`));
	} else {
		//recherche dans salon -> fetch
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
								console.info(`Message discord du devoir ${devoir.numéro} supprimé car ce devoir est trop vieux`);
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

const messageNonTrouveDansSalonDiscord = (db, devoir, channel, devoirEmbed) => {
	console.warn("Un devoir de la db ne correpond pas à un message discord");
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
			console.warn(`Devoir ${devoir.numéro} supprimé de la bd`);
			supprDbSync(db, devoir.numéro);
		}
	}
};

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

const supprDbSync = (db, numeroDev) => {
	for (let i = 0; i < db.groups.length; i++) {
		for (let j = 0; j < db.groups[i].devoirs.length; j++) {
			if (db.groups[i].devoirs[j].numéro === numeroDev) {
				db.groups[i].devoirs[j].splice(i, 1);
			}
		}
	}
	utils.updateDbFile(db);
};


exports.syncDB = syncDB;