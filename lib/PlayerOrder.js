/**
 * @constructor
 */
class PlayerOrder
{
	constructor (...aPlayers)
	{
		// An (ordered) array of player indices (in `GameRun.aPlayers`).
		// Order index => player index.
		// E.g. [0, 2, 1].
		this.aPlayerOrder = undefined;

		// Cached order in other data structures:

		// Letter => player index.
		// {A: 0, B: 2, C: 1}, where
		// 		A, B, C - letter of the player in `GameState`.
		// 		0, 1, 2 - index of the player in the players' array (`GameRun.aPlayers`).
		this.oPlayerOrderByLetter = undefined;
		// Player index => letter
		// [A, C, B]
		// [A, C, undefined, D]
		this.aPlayerOrderByIndex = undefined;

		this.jqEvents = $({});

		// Initial order.
		if (aPlayers) {
			this.SetOrder(...aPlayers);
		}

		/**
		 * Allows for getting player's letter and player's index by reading a respective dynamic property,
		 *  	e.g., oPlayerOrder.B (= 1), oPlayerOrder[2] (= C) (where `2` is the player's index in `GameRun.aPlayers`).
		 * @param aPlayers
		 * @return {Proxy}
		 */
		return new Proxy(this, {
			// Reading properties.
			get: function (oPlayerOrder, mProp)
			{
				// Dynamic properties.
				if (typeof mProp == 'string' && /^[A-Z]$/.test(mProp)) {
					return oPlayerOrder.GetPlayerIndexByLetter(mProp);
				}
				else if ((typeof mProp == 'number' || typeof mProp == 'string') && /^\d$/.test(mProp)) {
					return oPlayerOrder.GetPlayerLetterByIndex(mProp);
				}
				// Static properties of `PlayerOrder`.
				else {
					if (
						typeof mProp == 'string' && ! (mProp in oPlayerOrder)
						&& mProp != 'length'	// Do not warn if checking for length, lodash does it when cloning.
					) {
						console.error('Proxy for PlayerOrder: Unexpected property requested. ',
							mProp, ' is not a player identifier, neither a method.'
						);
					}

					return oPlayerOrder[mProp];
				}
			},

			// Checking for properties with `in`.
			// TODO Is this duplication with `get` unavoidable?
			has: function (oPlayerOrder, mProp)
			{
				// Dynamic properties.
				if (typeof mProp == 'string' && /^[A-Z]$/.test(mProp)) {
					return mProp in oPlayerOrder.oPlayerOrderByLetter;
				}
				else if ((typeof mProp == 'number' || typeof mProp == 'string') && /^\d$/.test(mProp)) {
					return mProp in oPlayerOrder.aPlayerOrderByIndex;
				}
				// Static properties of `PlayerOrder`.
				else {
					return mProp in oPlayerOrder;
				}
			}
		})
	}

	On (sEvent, fHandler)
	{
		this.jqEvents.on(sEvent, fHandler);
	}

	/**
	 * E.g. Passing (2, 0, 1) would mean {A: 2, B: 0, C: 1}.
	 *
	 * @param {number} iPlayerA	Index, in GameRun.aPlayers, of the first (A) player.
	 * @param {number} iPlayerB	Index, in GameRun.aPlayers, of the second (B) player.
	 * @param {number} iPlayerC	Index, in GameRun.aPlayers, of the third (C) player.
	 */
	SetOrder (iPlayerA, iPlayerB, iPlayerC)
	{
		const newOrder = [iPlayerA, iPlayerB, iPlayerC];

		if (! _.isEqual(newOrder, this.aPlayerOrder)) {
			this.aPlayerOrder = newOrder;

			this.oPlayerOrderByLetter = {
				A: iPlayerA,
				B: iPlayerB,
				C: iPlayerC
			};

			this.aPlayerOrderByIndex = [];
			this.aPlayerOrderByIndex[iPlayerA] = 'A';
			this.aPlayerOrderByIndex[iPlayerB] = 'B';
			this.aPlayerOrderByIndex[iPlayerC] = 'C';

			this.jqEvents.trigger('after_order_change');
		}
		// Else: Nothing to do.
	}

	/**
	 * TODO Currently, only three players supported.
	 * Shift the player order for the next game.
	 */
	ShiftPlayers ()
	{
		if (! this.aPlayerOrder) {
			throw "not good";	// TODO exceptions.
		}

		// The first player in the previous game becomes the last player in the next game, everybody else shifts accordingly.

		const newOrder = _.clone(this.aPlayerOrder);
		newOrder.push(newOrder.shift());
		this.SetOrder(...newOrder);
	}

	/**
	 * @param sPlayerLetter (in the current `GameState`).
	 * @return {int} Player index (in `GameRun.aPlayers`).
	 */
	GetPlayerIndexByLetter (sPlayerLetter)
	{
		return this.oPlayerOrderByLetter[sPlayerLetter];
	}

	/**
	 * @param iPlayerIndex Player index (in `GameRun.aPlayers`).
	 * @return {string}	Player letter (in the current `GameState`).
	 */
	GetPlayerLetterByIndex (iPlayerIndex)
	{
		return this.aPlayerOrderByIndex[iPlayerIndex];
	}

	IsSet ()
	{
		return !! this.aPlayerOrder;
	}

	Export ()
	{
		return _.clone(this.oPlayerOrderByLetter);
	}

	Import (oPlayerOrder)
	{
		const aPlayerOrder = [];

		let iLetters = 0;
		_.forEach(['A', 'B', 'C', 'D', 'E'], (sLetter) =>
		{
			if (sLetter in oPlayerOrder) {
				iLetters++;
				aPlayerOrder.push(oPlayerOrder[sLetter]);
			}
			else {
				if (_.size(oPlayerOrder) != iLetters) {
					throw 'Invalid order, should contain only successive letters as keys.';	// TODO Exceptions
				}

				// Break.
				return false;
			}
		});

		this.SetOrder(...aPlayerOrder);

		return this;	// For chaining.
	}

	/**
	 * Warning! Do not use _.cloneDeep, as the `Proxy` won't be preserved!
	 * This does not clone event handlers.
	 * @return {PlayerOrder}
	 */
	Clone ()
	{
		return new PlayerOrder().Import(this.Export());
	}
}
