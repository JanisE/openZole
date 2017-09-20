/**
 * Contains some game-specific logic.
 */

const aZoleStrength = [
	'🂹', '🂾', '🂺', '🂱',
	'🂩', '🂮', '🂪', '🂡',
	'🃙', '🃞', '🃚', '🃑',
	'🃇', '🃈', '🃉', '🃎', '🃊', '🃁',
	'🃋', '🂻', '🂫', '🃛',
	'🃍', '🂽', '🂭', '🃝'
];

const aZolePoints = {
	'🂹': 0, '🂾': 4, '🂺': 10, '🂱': 11,
	'🂩': 0, '🂮': 4, '🂪': 10, '🂡': 11,
	'🃙': 0, '🃞': 4, '🃚': 10, '🃑': 11,
	'🃇': 0, '🃈': 0, '🃉': 0, '🃎': 4, '🃊': 10, '🃁': 11,
	'🃋': 2, '🂻': 2, '🂫': 2, '🃛': 2,
	'🃍': 3, '🂽': 3, '🂭': 3, '🃝': 3
};

/**
 * @param {JsCard} oCard
 * @return {number}
 */
function CardToStrengthIndex (oCard)
{
	return _.indexOf(aZoleStrength, oCard.sCard);
}

/**
 * @param {JsCard} oCard
 * @return {boolean}
 */
function IsValidZoleCard (oCard)
{
	return JsCard.IsValidCard(oCard) && _.indexOf(aZoleStrength, oCard.sCard) >= 0;
}

/**
 * @param oCard
 * @return {boolean}
 */
function IsZoleTrumpCard (oCard)
{
	return (
		IsValidZoleCard(oCard)
		&& _.indexOf(aZoleStrength, oCard.sCard) >= _.indexOf(aZoleStrength, '🃇')
	);
}

/**
 * @param {Iterable} oCards
 * @return {number}
 */
function CountPoints (oCards)
{
//	console.log('CountPoints(', oCards, ')');

	let iPoints = 0;

	for (const oCard of oCards) {
		iPoints += aZolePoints[oCard.sCard];
	}

	return iPoints;
}

function GetZoleDeck ()
{
	return JsCard.ConstructJsCards(_.clone(aZoleStrength));
}

function GetUnknownZoleDeck ()
{
	return JsCard.ConstructJsCards(new Array(aZoleStrength.length).fill(undefined));
}

/**
 * @param oCardA
 * @param oCardB
 * @returns {Array}
 */
function ZoleSortByStrength (oCardA, oCardB)
{
	return CardToStrengthIndex(oCardA) - CardToStrengthIndex(oCardB);
}

/**
 * TODO In case of four players, do we calculate in the same way?
 * TODO How to include pule chips?
 * @param {GameState} oGameState
 */
function CalculateChips (oGameState)
{
	// The result as described by the chips.
	const oChips = {A: 0, B: 0, C: 0};
	const oStats = oGameState.oStats;

	switch (oGameState.sGameMode) {
	case 'augšā':
	case 'zole':
		const sLielais = oGameState.sGameModeBy;
		const iLielaisPoints = oStats[sLielais].points;
		const iLielaisTricks = oStats[sLielais].tricks;
		let iLielaisChips = 0;

		// Note: "lielais" might have the max points but not all the tricks (not having a {🃇, 🃈, 🃉} trick, for example).
		// 	That would not be a case of the max chips (of "bezstiķis").
		if (iLielaisTricks >= 8) {
			iLielaisChips = 6;
		}
		else if (iLielaisPoints > 90) {
			iLielaisChips = 4;
		}
		else if (iLielaisPoints > 60) {
			iLielaisChips = 2;
		}
		else if (iLielaisPoints > 30) {
			iLielaisChips = -4;
		}
		// Cannot use the points: if no tricks taken, the points of the initially discarded cards do not save the day.
		else if (iLielaisTricks > 0) {
			iLielaisChips = -6;
		}
		else {
			iLielaisChips = -8;
		}

		if (oGameState.sGameMode == 'zole') {
			iLielaisChips += (iLielaisChips > 0 ? 8 : -8);
		}

		oChips[sLielais] = iLielaisChips;
		oChips[GameState.GetNextPlayer(sLielais)] = iLielaisChips / -2;
		oChips[GameState.GetNextPlayer(GameState.GetNextPlayer(sLielais))] = iLielaisChips / -2;
		break;

	case 'galdiņš':
		const iMaxTakenTricks = Math.max(oStats.A.tricks, oStats.B.tricks, oStats.C.tricks);
		let aLosersByTrickCount = ['A', 'B', 'C'].filter(sPlayer => oStats[sPlayer].tricks >= iMaxTakenTricks);

		// The max points of the losers by the taken trick count.
		const iMaxPoints = aLosersByTrickCount.reduce((iMax, sPlayer) => (iMax < oStats[sPlayer].points ? oStats[sPlayer].points : iMax), 0);
		const aLosers = aLosersByTrickCount.filter(sPlayer => oStats[sPlayer].points >= iMaxPoints);

		// Each losers gives other players (also, other losers) two chips to each.
		for (const sLoser of aLosers) {
			for (const sOtherPlayer of ['A', 'B', 'C'].filter(sPlayer => sPlayer != sLoser)) {
				oChips[sLoser] -= 2;
				oChips[sOtherPlayer] += 2;
			}
		}
		break;

	case 'mazā zole':
		const sMazais = oGameState.sGameModeBy;

		oChips[sMazais] = (oStats[sMazais].tricks <= 0 ? 12 : -14);
		oChips[GameState.GetNextPlayer(sMazais)] = oChips[sMazais] / -2;
		oChips[GameState.GetNextPlayer(GameState.GetNextPlayer(sMazais))] = oChips[sMazais] / -2;
		break;

	case 'pule':
		// Nothing to do.
		break;

	default:
		console.error('Unexpected game mode: ', oGameState.sGameMode);
	}

	return oChips;
};