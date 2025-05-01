import { StyleSheet } from 'react-native';

export const COLORS = {
  PLAYER_X: '#7CB9E8',
  PLAYER_O: '#FFB6C1',
  WHITE: '#fff'
} as const;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameContainer: {
    padding: 20,
  },
  turnContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  turnTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginRight: 10,
  },
  turnTextPlayerX: {
    color: COLORS.PLAYER_X,
  },
  turnTextPlayerO: {
    color: COLORS.PLAYER_O,
  },
  textWinnerX: {
    color: COLORS.PLAYER_X,
  },
  textWinnerO: {
    color: COLORS.PLAYER_O,
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
  },
  cellBorder: {
    borderWidth: 2,
    borderColor: '#333',
  },
  cell: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 60,
    color: COLORS.WHITE,
  },
  cellTextX: {
    color: COLORS.PLAYER_X,
  },
  cellTextO: {
    color: COLORS.PLAYER_O,
  },
  resetButton: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  resetButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 