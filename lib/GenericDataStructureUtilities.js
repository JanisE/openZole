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