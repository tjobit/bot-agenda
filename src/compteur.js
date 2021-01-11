require("better-logging")(console);

/**
 * Compte le nombre de jours entre la date donnée et la date d'ajourd'hui
 * @param date la date du devoir donné
 * @return le nombre de jours restant avant la date de remise
 */
const compteur = (date) => {
	let today = new Date();
	today.setHours(0,0,0);
	let dateDevoir = date;
	// Crée un tableau de taille 2, à l'index 0 on a le jour et à l'index 1 on a le mois 
	const splitArr = dateDevoir.split("/");
	const dayDevoir = parseInt(splitArr[0]);
	const monthDevoir = parseInt(splitArr[1]);
	dateDevoir = new Date(2021, monthDevoir - 1, dayDevoir + 1);

	return Math.round((dateDevoir - today) / (1000 * 60 * 60 * 24)) - 1;

};

exports.compteur = compteur;