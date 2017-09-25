class PulesManager
{
	constructor ()
	{
		this.iCommon = 0;	// The number of common pules.

		// The current number of personal pules for each user.
		this.oPersonalByUser = [0, 0, 0];	// User index => count.
		// The order of the currently present personal pules, from the earliest to the last.
		this.oPersonalOrder = [];	// Order index => user index.
	}

	PresentPersonalPule (iUser)
	{
		this.oPersonalOrder.push(iUser);
		this.oPersonalByUser[iUser]++;
	}

	ClearPersonalPule (iUser)
	{
		for (let i = 0; i < this.oPersonalOrder.length; i++) {
			if (this.oPersonalOrder[i] == iUser) {
				this.oPersonalOrder.splice(i, 1);
				this.oPersonalByUser[iUser]--;
				break;
			}
		}
	}

	/**
	 * Account for another game, updating the pules status and returning the additional chips to be added to the game result.
	 *
	 * @param {GameState} oGameState
	 * @param {PlayerOrder} oPlayerOrder
	 * @return {Object} Pule chips to be added to the result. {player letter => chips}
	 */
	NextGame (oGameState, oPlayerOrder)
	{
		if (! oGameState.IsGameOver()) {
			throw "Game not finished.";	// TODO Exceptions.
		}

		// Additional chips gained (lost) in the specific game because of pules.
		const oPuleChips = {A: 0, B: 0, C: 0};

		switch (oGameState.sGameMode) {
		case 'pule':
			// A common pule gets added.
			this.iCommon++;
			break;

		case 'augšā':
			const sLielais = oGameState.sGameModeBy;	// The (game) letter of the player.
			const iLielais = oPlayerOrder[sLielais];	// The (game run) index of the player.

			// If "lielais" wins, it's a chance for them to...
			if (oGameState.CalculateGameChips()[sLielais] > 0) {
				// ... take back one of their own personal pules, if any are present.
				if (this.oPersonalByUser[iLielais] > 0) {
					this.ClearPersonalPule(iLielais);
				}
				// ... take a common pule, if present.
				else if (this.iCommon > 0) {
					this.iCommon--;

					// This pule gives him one chip from each loser. TODO Support more than 3 players.
					oPuleChips[sLielais] = 2;
					oPuleChips[GameState.GetNextPlayer(sLielais)] = -1;
					oPuleChips[GameState.GetNextPlayer(GameState.GetNextPlayer(sLielais))] = -1;
				}
				// .. take a personal pule of another user, if no common pules are present.
				else if (this.oPersonalOrder.length > 0) {
					const iPlayerWithOldestPersonalPule = this.oPersonalOrder[0];
					this.ClearPersonalPule(iPlayerWithOldestPersonalPule);

					// This pule gives him three chips from the pule's owner. TODO Support more than 3 players.
					oPuleChips[sLielais] = 3;
					oPuleChips[oPlayerOrder[iPlayerWithOldestPersonalPule]] = -3;
				}
				// Else: no changes in pules, no extra chip handling.
			}
			// If "lielais" loses:
			else {
				// "Lielais" presents a personal pule if there already are common pules present.
				if (this.iCommon > 0) {
					this.PresentPersonalPule(iLielais);
				}
				// Else: no changes in pules, no extra chip handling.
			}
		//default: In the other cases, no changes in pules, no extra chip handling.
		}

//		console.log(oPuleChips, this.iCommon, this.oPersonalByUser, this.oPersonalOrder);
		return oPuleChips;
	}
}