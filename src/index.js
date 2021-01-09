require("better-logging")(console);
const Discord = require("discord.js");
const botClient = new Discord.Client();
const config = require("../config.json");

const asciiCats = require("ascii-cats");
const cron = require("cron");

const embed = require("./embeds");
const ajout = require("./ajoutDB");
const utils = require("./utils");
const init = require("./initDb");
const suppr = require("./supprDB");
const modif = require("./modifDB");
const syncDB = require("./syncDB");

/**
 * Au démarrage du bot
 */
botClient.on("ready", () => {
	//Status du bot
	botClient.user.setActivity("!help-agenda");

	console.clear();
	console.log(
		"\n=============================\n"
		+ asciiCats("nyan")
		+ "\n\n Bot started ! "
		+ "\n Tomm Jobit - Riboulet Célian (feat Victor LP)"
		+ "\n============================="
	);

	let scheduledMessage = new cron.CronJob("00 00 01 * * *", () => {
		syncDB.syncDB(require("./devoirs.json"), botClient);
		console.info("cron update");
	});

	scheduledMessage.start();

	syncDB.syncDB(require("./devoirs.json"), botClient);

});

/**
 * Des qu'un message sur le serveur ou le bot est présent est reçu
 */
botClient.on("message", msg => {
	let db = require("./devoirs.json");

	//On regarde si le message commence bien par le prefix (!)
	if (!msg.content.startsWith(config.prefix))//Si le message ne commence pas par le prefix du config.json
		return;

	switch (msg.content.substr(1).split(" ")[0]) {//Switch sur le premier mot du msg sans le prefix Ex: "!agenda dejfez" donne "agenda"
		case "init-agenda":
			init.groupInit(db, msg);
			break;

		case "agenda":
			ajout.ajoutDb(db, msg, botClient);
			break;

		case "debug":
			utils.debugDbFile(db, msg);
			break;

		case "clear-db":
			utils.clearDbFile(db, msg);
			return;

		case "help-agenda":
			msg.channel.send(embed.helpEmbed());
			break;

		case "suppr-agenda":
			suppr.supprDb(db, msg);
			break;

		case "modif-agenda":
			modif.modifDB(db, msg, botClient);
			break;

		default:
			console.warn("Commande non reconnue : " + msg.content);
			break;
	}

	if (msg)
		if (msg.deletable)
			msg.delete().catch(() => { console.debug("msg supprimé avant la fin d'execution (Ceci n'est pas un problème)"); });

});

//Bot login
botClient.login(config.token);