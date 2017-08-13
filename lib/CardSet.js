//let JsCard = this.JsCard;
//if (! JsCard) {
//	JsCard = require('../lib/JsCard.js').JsCard;
//}

/**
 * JS Set.has does not understand JsCard's value, so we have a dedicated CardSet type instead of "Set".
 * @constructor
 * @param {Iterable} [oInitial]
 */
function CardSet (oInitial)
{
	// If "new" missing, fix it.
	if (! (this instanceof CardSet)) {
		return new CardSet(oInitial);
	}

	this.iUnknownCards = 0;
	this.oKnownCards = new Set();	// A set of Strings ("JsCard.sCard"s).

	// Initial content.
	if (oInitial) {
		this.Import(oInitial);
	}
}

CardSet.prototype[Symbol.iterator] = function* CardSet_iterator ()
{
	// At first, return all known cards.
	for (const sCard of this.oKnownCards) {
		yield new JsCard(sCard);
	}

	// Then return all unknown cards.
	for (let i = this.iUnknownCards; i > 0; i--) {
		yield new JsCard(undefined);
	}
};

/**
 * @param {JsCard} oCard
 */
CardSet.prototype.Add = function CardSet_Add (oCard)
{
	if (! oCard.IsKnown()) {
		this.iUnknownCards++;
	}
	else {
		this.oKnownCards.add(oCard.sCard);
	}
};

/**
 * @param {JsCard} oCard
 */
CardSet.prototype.Remove = function CardSet_Remove (oCard)
{
	if (! oCard.IsKnown()) {
		if (this.iUnknownCards > 0) {
			this.iUnknownCards--;
		}
		else {
			console.error('Removing a card that was not in the hand: ', oCard);
		}
	}
	else {
		this.oKnownCards.delete(oCard.sCard);
	}
};

/**
 * @param {Iterable} oContent
 */
CardSet.prototype.Import = function CardSet_Import (oContent)
{
	if (oContent && typeof oContent[Symbol.iterator] == 'function') {
		for (const oCard of oContent) {
			this.Add(oCard);
		}
	}
};

/**
 * @param {Iterable} oReplaceWith
 */
CardSet.prototype.ReplaceWith = function CardSet_ReplaceWith (oReplaceWith)
{
	this.Clear();
	this.Import(oReplaceWith);
};

CardSet.prototype.Clear = function CardSet_Clear ()
{
	this.iUnknownCards = 0;
	this.oKnownCards.clear();
};

/**
 * @returns {number}
 */
CardSet.prototype.Size = function CardSet_Size ()
{
	return (this.iUnknownCards + this.oKnownCards.size);
};

/**
 * @returns {boolean}
 */
CardSet.prototype.AreAllKnown = function CardSet_AreAllKnown ()
{
	return (this.iUnknownCards <= 0);
};

/**
 * @returns {boolean}
 */
CardSet.prototype.HasKnown = function CardSet_HasKnown ()
{
	return (this.oKnownCards.size > 0);
};

/**
 * In the case of an unknown card, the reply means that, yes, the player hand has an unknown card.
 * @param {JsCard} oCard
 * @returns boolean|undefined
 */
CardSet.prototype.Has = function CardSet_Has (oCard)
{
	return (
		(! oCard.IsKnown() && this.iUnknownCards > 0)
		|| this.oKnownCards.has(oCard.sCard)
	);
};

/**
 * @param {CardSet} oSet
 * @returns boolean
 */
CardSet.prototype.Equals = function CardSet_Equals (oSet)
{
	let bEquals = true;

	if (this.Size() != oSet.Size()) {
		bEquals = false;
	}
	else {
		const aDifference = [... oSet].filter(oCard => ! this.Has(oCard));

		if (aDifference.length > 0) {
			bEquals = false;
		}
	}

	return bEquals;
};

if (typeof module != 'undefined') {
	module.exports = {
		CardSet: CardSet
	};
}
