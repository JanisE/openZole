/**
 * Contains some game-specific logic.
 */

Zole = {

	aZoleStrength: [
		'🂹', '🂾', '🂺', '🂱',
		'🂩', '🂮', '🂪', '🂡',
		'🃙', '🃞', '🃚', '🃑',
		'🃇', '🃈', '🃉', '🃎', '🃊', '🃁',
		'🃋', '🂻', '🂫', '🃛',
		'🃍', '🂽', '🂭', '🃝'
	],

	aZolePoints: {
		'🂹': 0, '🂾': 4, '🂺': 10, '🂱': 11,
		'🂩': 0, '🂮': 4, '🂪': 10, '🂡': 11,
		'🃙': 0, '🃞': 4, '🃚': 10, '🃑': 11,
		'🃇': 0, '🃈': 0, '🃉': 0, '🃎': 4, '🃊': 10, '🃁': 11,
		'🃋': 2, '🂻': 2, '🂫': 2, '🃛': 2,
		'🃍': 3, '🂽': 3, '🂭': 3, '🃝': 3
	},

	/**
	 * @param {JsCard} oCard
	 * @return {number}
	 */
	CardToStrengthIndex: function Zole_CardToStrengthIndex (oCard)
	{
		return _.indexOf(Zole.aZoleStrength, oCard.sCard);
	},

	/**
	 * @param {JsCard} oCard
	 * @return {boolean}
	 */
	IsValidZoleCard: function Zole_IsValidZoleCard (oCard)
	{
		return JsCard.IsValidCard(oCard) && _.indexOf(Zole.aZoleStrength, oCard.sCard) >= 0;
	},

	/**
	 * @param oCard
	 * @return {boolean}
	 */
	IsZoleTrumpCard: function Zole_IsZoleTrumpCard (oCard)
	{
		return (
			Zole.IsValidZoleCard(oCard)
			&& _.indexOf(Zole.aZoleStrength, oCard.sCard) >= _.indexOf(Zole.aZoleStrength, '🃇')
		);
	},

	/**
	 * @param {Iterable.<JsCard>} oCards
	 * @return {number}
	 */
	CountPoints: function Zole_CountPoints (oCards)
	{
		//	console.log('Zole_CountPoints(', oCards, ')');

		let iPoints = 0;

		for (const oCard of oCards) {
			iPoints += Zole.aZolePoints[oCard.sCard];
		}

		return iPoints;
	},

	GetZoleDeck: function Zole_GetZoleDeck ()
	{
		return JsCard.ConstructJsCards(_.clone(Zole.aZoleStrength));
	},

	GetUnknownZoleDeck: function Zole_GetUnknownZoleDeck ()
	{
		return JsCard.ConstructJsCards(new Array(Zole.aZoleStrength.length).fill(undefined));
	},

	/**
	 * @param oCardA
	 * @param oCardB
	 * @returns {int}
	 */
	ZoleSortByStrength: function Zole_ZoleSortByStrength (oCardA, oCardB)
	{
		return Zole.CardToStrengthIndex(oCardA) - Zole.CardToStrengthIndex(oCardB);
	}
};
