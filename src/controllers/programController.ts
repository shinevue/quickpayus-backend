import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import Program, { IProgram } from '../models/ProgramModel';
import { Request, Response, NextFunction } from 'express';

interface IProgramData {
  investment: number;
  level: string;
  // Add other properties as necessary
}

interface ILevelQuery {
  level: string;
  sublevel: string;
}

const get = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const programs: IProgram[] = await Program.find({});
    if (!programs?.length) {
      return res.json({
        success: false,
        data: [],
      });
    }
    res.json({
      success: true,
      data: programs,
    });
  },
);

const update = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const programs: IProgramData[] = req.body.program;
    await Program.deleteMany({});
    const savePromises = programs.map((program) => new Program(program).save());
    await Promise.all(savePromises);
    res.send({
      success: true,
    });
  },
);

const findByInvestment = async (
  investment: number,
): Promise<any> => {
  const program = await Program.findOne(
    {
      'data.investment': { $lte: investment },
    },
    { level: 1, data: 1, _id: 0 },
  )
    .sort({ 'data.investment': -1 })
    .limit(1);

  if (!program) return null;

  const { level, data } = program;
  const selectedData = data
    .reverse()
    .find((item: any) => item?.investment <= investment);

  return { level, data: selectedData || {} };
};

const findByLevels = async (
  query: ILevelQuery,
): Promise<{ level: string; data: any } | null> => {
  const program = await Program.findOne(
    {
      level: String(query?.level),
    },
    { level: 1, data: 1, _id: 0 },
  ).limit(1);

  if (!program) return null;

  const { level, data } = program;
  const selectedData = data.find(
    (item: any) => item?.level === String(query?.sublevel),
  );

  return { level, data: selectedData };
};

const find = async (query: any): Promise<IProgram[]> => {
  return await Program.find(query);
};

const findOne = async (query: any): Promise<IProgram | null> => {
  return await Program.findOne(query);
};

const programCtlr = {
  get,
  update,
  findByInvestment,
  findByLevels,
  find,
  findOne,
};

export default programCtlr;
