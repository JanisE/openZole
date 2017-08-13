
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
 * Actually, returns the first element, however, there is no strict "first element" in a Set.
 * 		It probably is the first element that was added into the set.
 * 		Or it may be undefined if the set is empty.
 * @param {Set} oSet
 */
function SelectAnySetItem (oSet)
{
	return oSet.values().next().value;
}

/**
 * @param {Set} oSet
 */
function SelectRandomSetItem (oSet)
{
	const aElements = [...oSet];

	return aElements[Math.floor(Math.random() * aElements.length)];
}

/**
 * @param {CardSet} oHand
 * @param {Function} fFilter
 * @return {CardSet}
 */
function SelectCards (oHand, fFilter)
{
	const oSelected = new CardSet();

	for (const oCard of oHand) {
		if (fFilter(oCard)) {
			oSelected.Add(oCard);
		}
	}

	return oSelected;
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
 * Fisher-Yates shuffle.
 * @param {String} aCards Any type of elements actually, doesn't matter wether JsCard, cards,js Card, or string.
 */
function ShuffleCardsInPlace (aCards)
{
	let i = aCards.length;

	if (i <= 0) {
		return;
	}

	while (--i) {
		const j = Math.floor(Math.random() * (i + 1));
		const tempi = aCards[i];
		aCards[i] = aCards[j];
		aCards[j] = tempi;
	}

	return aCards;
}

/**
 * @param {String[]} aCards
 * @return {JsCard[]}
 */
function ConstructJsCards (aCards)
{
	const aJsCards = [];

	const iCardCount = aCards.length;
	for (let i = 0; i < iCardCount; i++) {
		aJsCards.push(new JsCard(aCards[i]));
	}

	return aJsCards;
}

function GetShuffledDeck ()
{
	const aShuffledStrings = ShuffleCardsInPlace(_.clone(aZoleStrength));

	return ConstructJsCards(aShuffledStrings);
}

function GetUnknownDeck ()
{
	return ConstructJsCards(new Array(aZoleStrength.length).fill(undefined));
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

/**
 * TODO In case of four players, do we calculate in the same way?
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
		let iLielaisChips = 0;

		if (iLielaisPoints >= 120) {
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
		else if (iLielaisPoints > 0) {
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
}

// Sandbox

const oDealer = new Dealer({name: 'Test game', description: 'Only computers allowed.', start_time: moment().format()});
oDealer.SetUiAdapter(new UiAdapter_CardsJs());

oDealer.SetPlayers([new RandomMovesMaker({name: 'Katniss'}), new RandomMovesMaker({name: 'Rob'}), new RandomMovesMaker({name: 'Petar'})]);
oDealer.StartGameRun(5);
