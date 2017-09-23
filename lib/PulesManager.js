class PulesManager
{
	constructor ()
	{
		this.iCommon = 0;	// The number of common pules.
		this.iPersonal = undefined;	// The user with a personal pule.
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
			const oGameChips = oGameState.CalculateGameChips();
			const sLielais = oGameState.sGameModeBy;

			// Personal pule from the previous games is cleared, if present.
			if (this.iPersonal != undefined) {
				const sPersonalPuleHolder = oPlayerOrder[this.iPersonal];
				// If the holder of the personal pule lost, he loses two additional chips for each winner.
				if (oPuleChips[oPlayerOrder[this.iPersonal]] < 0) {
					if (sPersonalPuleHolder == sLielais) {
						oPuleChips[sPersonalPuleHolder] = -4;
						oPuleChips[GameState.GetNextPlayer(sPersonalPuleHolder)] = 2;
						oPuleChips[GameState.GetNextPlayer(GameState.GetNextPlayer(sPersonalPuleHolder))] = 2;
					}
					else {
						oPuleChips[sPersonalPuleHolder] = -2;
						oPuleChips[sLielais] = 2;
					}
				}
				// Else: the pule is cleared without anyone gaining chips.

				this.iPersonal = undefined;
			}
			// If there was no personal pule, a common pule is considered, if present.
			else {
				if (this.iCommon > 0) {

					// If lielais won...
					if (oGameChips[sLielais] > 0) {
						// Lielais gets an extra chip from each loser.
						oPuleChips[sLielais] = 2;
						oPuleChips[GameState.GetNextPlayer(sLielais)] = -1;
						oPuleChips[GameState.GetNextPlayer(GameState.GetNextPlayer(sLielais))] = -1;

						// The common pule gets cleared.
						this.iCommon--;
					}
					else {
						// A personal pule gets assigned.
						this.iPersonal = oPlayerOrder[sLielais];
					}
				}
				// Else: no common pules to consider.
			}
			break;

		//default: In the other cases, pules are kept as is.
		}

		return oPuleChips;
	}
}