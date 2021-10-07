export function uniqBy(ary: any[], attr: string): any[] {
  return Array.from(new Set(ary.map((row) => row[attr])));
}

export function chunk<T>(ary: T[], size: number): T[][] {
  let tmp = [];
  return ary.reduce((acc, current, index) => {
      index++;
      tmp.push(current);
      if (index % size === 0) {
          acc.push(tmp);
          tmp = [];
      }
      if (index === ary.length) {
          acc.push(tmp);
      }
      return acc;
  }, []);
}

export function sumBy(ary: any[], attr: string): number {
  return ary.reduce((acc, current) => {
      acc += Number(current[attr]);
      return acc;
  }, 0);
}

export function mapKeys(ary: any, attr: string): {} {
  return ary.reduce((acc, current) => {
      acc[current[attr]] = current;
      return acc;
  }, {});
}
