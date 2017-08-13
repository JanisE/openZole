/**
 * @param {String|undefined} sCard Unicode character of the card.
 * @constructor
 */
function JsCard (sCard)
{
	// If "new" missing, fix it.
	if (! (this instanceof JsCard)) {
		return new JsCard(sCard);
	}

	// May be undefined, which means that the user knows that the card exists,
	// 		but does not know which one it is.
	this.sCard = sCard;
}

/**
 * @returns {boolean}
 */
JsCard.prototype.IsKnown = function JsCard_IsKnown ()
{
	return this.sCard !== undefined;
};

/**
 * @returns {String|undefined}
 */
JsCard.prototype.GetSuit = function JsCard_GetSuit ()
{
	if (! this.IsKnown()) {
		return undefined;
	}
	else if (this.sCard <= '🂮') {
		return '♠';
	}
	else if (this.sCard <= '🂾') {
		return '♥';
	}
	else if (this.sCard <= '🃎') {
		return '♦';
	}
	else {
		return '♣';
	}
};

/**
 * @param {JsCard} oCard
 * @returns {boolean|undefined}
 */
JsCard.prototype.IsOfSameSuit = function IsOfSameSuit (oCard)
{
	if (! this.IsKnown() || ! oCard.IsKnown()) {
		return undefined;
	}
	else {
		return (this.GetSuit() == oCard.GetSuit());
	}
};

/**
 * @param {JsCard} oCard
 * @return {boolean}
 */
JsCard.IsValidCard = function IsValidCard (oCard)
{
	return ! oCard.IsKnown() || oCard.sCard >= '🂡' && oCard.sCard <= '🃞';
};

if (typeof module != 'undefined') {
	module.exports = {
		JsCard: JsCard
	};
}
