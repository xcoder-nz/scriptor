jest.mock('yargs', () => ({
    __esModule: true,
    default: jest.fn(() => ({ argv: {} })),
  }));
  
  jest.mock('yargs/helpers', () => ({
    hideBin: jest.fn(argv => argv.slice(2)),
  }));
  
  import yargs from 'yargs';
  import { hideBin } from 'yargs/helpers';
  import { main } from '../../cli/hello';
  
  // Cast imported functions to Jest mocks to satisfy TypeScript
  const yargsMock = yargs as unknown as jest.Mock;
  const hideBinMock = hideBin as unknown as jest.Mock;
  
  describe('main()', () => {
    let logSpy: jest.SpyInstance;
  
    beforeEach(() => {
      // Clear only mock usage data, keep implementations intact so yargs() still returns { argv: {} }
      jest.clearAllMocks(); 
      logSpy = jest.spyOn(console, 'log').mockImplementation();
    });
  
    afterEach(() => {
      logSpy.mockRestore();
    });
  
    it('calls yargs with hideBin(process.argv) and logs greeting', () => {
      // Execute main()
      main();
  
      // hideBin should be called with process.argv
      expect(hideBinMock).toHaveBeenCalledWith(process.argv);  
  
      // yargs default export mock should be called with the hideBin return value
      const args = hideBinMock.mock.results[0].value;
      expect(yargsMock).toHaveBeenCalledWith(args);
  
      // console.log was called with the greeting
      expect(logSpy).toHaveBeenCalledWith('Hello, world!');
    });
  });
  