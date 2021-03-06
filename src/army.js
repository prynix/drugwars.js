import { orderBy } from 'lodash';
import Unit from './unit';
import dwunits from './units.json';
import Troop from './troop';

export default class Army {
  constructor(units, name, trainings, buildings, log) {
    this.units = [];
    this.trainings = [];
    this.buildings = [];
    this.groups = []
    this.alive = true;
    this.name = name;
    this.log = log;
    this.groupid = 1;
    units.forEach(unit => {
      const baseAmount = dwunits[unit.key].group;
      if(this.name === "defender" && unit.key ==='spy')
      {

      }
      else if(this.name ==="defender" && unit.key ==='hobo')
      {

      }
      else if(unit.amount>0)
      {
          let group_amount = unit.amount;
          while(group_amount>0)
          {
            if(group_amount >= baseAmount)
            {
              group_amount = group_amount - baseAmount
              this.groups.push(new Troop(unit.key, Number(baseAmount), this.groupid++, name, log));	
            }
            else{
              if(group_amount>0)
              {
                this.groups.push(new Troop(unit.key, Number(group_amount), this.groupid++, name, log));	
                group_amount = 0
              }
            }
          }
        // else{
        //   for (let i = 0; i < unit.amount; i += 1) {
        //     if (this.name === 'defender' && unit.key === 'hobo' || this.name === 'defender' &&  unit.key === 'spy' ) {
            
        //     }
        //     else
        //      {
        //       this.units.push(new Unit(unit.key, i + 1, name, log));
        //      }
        //   }
        // }
      }
    });
    trainings.forEach(training => {
          if (training.key === 'routing' || training.lvl < 1) {
          }
          else
          this.trainings.push({key:training.key,lvl:training.lvl});
    });
    //ATTRIBUTE TRAINING MODIFICATOR
    this.groups.forEach(unit => {
      // HOBO
      if(unit.key === "hobo")
      {
        const kamikaze = this.trainings.find(b => b.key === 'spiritwine');
        if(kamikaze)
        unit.attack = unit.attack + (unit.attack /100 * kamikaze.lvl);
      }
      else
      {
        const protection = this.trainings.find(b => b.key === 'protection');
        const giant = this.trainings.find(b => b.key === 'giant');
        if(protection)
        unit.defense = unit.defense +  (unit.defense/5 *protection.lvl);
        if(giant)
        unit.health = unit.health +  (unit.health/200 *giant.lvl);
          //ALL MELEE
          if(unit.spec.type === 'Melee')
          {
            const closecombat = this.trainings.find(b => b.key === 'closecombat');
            if(closecombat)
            unit.attack = unit.attack + (unit.attack /100 * closecombat.lvl);
          }
          else{
            const firearms = this.trainings.find(b => b.key === 'firearms');
            if(firearms)
            {
              unit.attack = unit.attack + (unit.attack /100 * firearms.lvl);
            }
          }
          if(unit.key === "sniper")
          {
            const sniping = this.trainings.find(b => b.key === 'sniping');
            if(sniping)
            unit.attack = unit.attack + (unit.attack /100 * sniping.lvl);
          }
          else if(unit.key === "bazooka")
          {
            const bomb = this.trainings.find(b => b.key === 'bomb');
            if(bomb)
            unit.attack = unit.attack + (unit.attack /100 * bomb.lvl);
          }
          //WEAPON
          else if(unit.key === "rowdy" || unit.key === "sniper" || unit.key === "hitman")
            {
            const firearms = this.trainings.find(b => b.key === 'weapon');
            if(firearms)
            {
              unit.attack = unit.attack + (unit.attack /100 * firearms.lvl);
            }
          }
          // FIRE
          if(unit.key === "bazooka" || unit.key === "gunman")
          {
            const fire = this.trainings.find(b => b.key === 'fire');
            if(fire)
            unit.attack = unit.attack + (unit.attack /100 * fire.lvl);
          }
  
          // CHEMICAL
          if(unit.key === "mercenary"  || unit.key === "knifer")
          {
            const chemical = this.trainings.find(b => b.key === 'chemical');
            if(chemical)
            unit.attack = unit.attack + (unit.attack /100 *chemical.lvl);
          }
          
          //ELITE
          if(unit.key === "mercenary" || unit.key === "knifer" || unit.key === "big_mama" || unit.key === "ninja")
          {
            const psychological = this.trainings.find(b => b.key === 'psychological');
            if(psychological)
            {
              unit.attack = unit.attack + (unit.attack /200 *psychological.lvl);
              unit.defense = unit.defense + (unit.defense /200 *psychological.lvl);
            }
          }
      }
    })
  }

  chooseActions(round) {
    const actions = [];
    this.groups.forEach(group => {
      if (group.undead > 0 && group.key != 'spy' && round != 1 || group.spec.range > 4 || group.spec.skill.type === 'tastynasty' || group.key === 'hobo') {
        const attack = group.getAttack();
        if (attack > 0) {
          actions.push([attack, group.skill, group.key, group.i, parseInt(group.undead)]);
        }
      }
      else if(group.undead > 0 && group.key != 'spy'){
        const attack = group.getAttack()/5;
        if (attack > 0) {
          actions.push([attack, group.skill, group.key, group.i,parseInt(group.undead/5)]);
        }
      }
      if (group.grouphealth < 0 || group.grouphealth === 0  && !group.dead) group.kill();
    });
    return actions;
  }

  //Process all actions for attacker and defender
  processAllActions(allies, attackpower, enemies, round) {
    this.processArmyActions('allies', allies, null, null, round);
    this.processArmyActions('enemies',enemies, attackpower, round);
  }

  processArmyActions(target, actions, attackpower,round) {
    const unitsSorted = orderBy(this.groups, ['priority'], ['asc']);
    const unitsByHighestPriority = orderBy(this.groups, ['priority'], ['desc']);
    actions.forEach(action => {
      const serie = [];
      const skill_type = action[1].type;
      const name = action[2];
      const num = action[3];
      const undead = action[4];
      let attack = 0;
      let buff = 0;
      if (target === 'allies') {
        switch (skill_type) {
          case 'heal':
              buff = {}
              buff.points = parseInt(action[1].effect);
              buff.author = name
              buff.num = num
              serie.push(buff);
            break;
          case 'groupheal':
              buff = {}
              buff.points = parseInt(action[1].effect);
              buff.author = name
              buff.num = num
            for (let i = 0; i < action[1].range; i += 1) {
              serie.push(buff);
            }
            break;
          default:
            break;
        }
        unitsSorted.forEach(unit => {
          if (serie.length > 0 && unit.undead>0) {
            unit.takeGroupBuff(serie[0].points , skill_type, round ,serie[0].author, serie[0].num);
            serie.splice(0, 1);
          }
        });
      }
      else {
        switch (skill_type) {
          case 'splash':
            attack = {}
            attack.author = name
            attack.num = num
            attack.dmg = action[0];
            for (let i = 0; i < action[1].range; i += 1) {
              serie.push(attack);
            }
            break;
          case 'attack':
          attack = {}
          attack.author = name
          attack.num = num
          attack.dmg = action[0];
            serie.push(attack);
            break;
          case 'multiplehit':
          attack = {}
          attack.author = name
          attack.num = num
          attack.dmg = action[0];
            for (let i = 0; i < action[1].range; i += 1) {
              serie.push(attack);
            }
            unitsSorted.forEach(unit => {
              if (unit.undead>0 && serie.length > 0) {
                unit.takeGroupDamages(serie[0].dmg * attackpower / 100, skill_type, round , serie[0].author, serie[0].num,undead);
                serie.splice(0, 1);
              }
            });
            break;
          case 'criticalhit':
          attack = {}
          attack.author = name
          attack.num = num
          attack.dmg = (action[0] * action[1].range * round * attackpower / 100);
            serie.push(attack);
            break;
          case 'tastynasty':
          attack = {}
          attack.author = name
          attack.num = num
          attack.dmg = parseInt(action[0]);
            serie.push(attack);
            unitsByHighestPriority.forEach(unit => {
              if (unit.undead>0 && serie.length > 0) {
                unit.takeGroupDamages(serie[0].dmg * attackpower / 100, skill_type, round,serie[0].author, serie[0].num,undead);
                serie.splice(0, 1);
              }
            });
            break;
          default:
          attack = {}
          attack.author = name
          attack.num = num
          attack.dmg = action[0];
          serie.push(attack);
            break;
        }
        unitsSorted.forEach(unit => {
          if (unit.undead>0 && serie.length > 0) {
            unit.takeGroupDamages(serie[0].dmg * attackpower / 100, skill_type, round , serie[0].author, serie[0].num,undead);
            serie.splice(0, 1);
          }
        });
      }
    });

    this.updateAliveStatus();
  }

  updateAliveStatus() {
    let size = 0;
    this.groups.forEach(group => {
      if (group.undead>0) {
        size += Number(group.undead)
      }
    });
    if (size<1) {
      this.alive = false;
    }
  }

  size() {
    let size = 0;
    this.groups.forEach(group => {
      if (group.undead>0) {
        size += Number(group.undead)
      }
    });
    return size
  }

  cost() {
    let drug_cost = 0;
    let weapon_cost = 0;
    let alcohol_cost = 0;
    this.groups.forEach(group => {
      if (group.undead>0) {
        drug_cost += dwunits[group.key].drugs_cost * group.undead
        weapon_cost += dwunits[group.key].weapons_cost * group.undead
        alcohol_cost += dwunits[group.key].alcohols_cost * group.undead
      }
    });
    return {drug_cost,weapon_cost,alcohol_cost}
}

  supply() {
    let supply = 0;
    this.groups.forEach(unit => {
      if (unit.undead>0)
        supply += dwunits[unit.key].supply * unit.undead
    });
    return supply
  }

  capacity() {
    let capacity = 0;
    this.groups.forEach(unit => {
      if (unit.undead>0)
      capacity += dwunits[unit.key].capacity * unit.undead
    });
    return capacity
  }

  attackPower() {
    let supply = 0;
    this.groups.forEach(unit => {
      if (unit.undead>0)
        supply += dwunits[unit.key].supply * unit.undead
    });
    let power = Math.round(100 - parseFloat(supply / 6).toFixed(0) / 100)
    const coordination = this.trainings.find(b => b.key === 'coordination');
    if(coordination)
    power = power + parseInt(coordination.lvl)/10
    if(power>=60)
    {
      if(power > 100)
      power = 100
      return power
    }
    else return 60
  }

  defensiveAttackPower() {
    let supply = 0;
    this.groups.forEach(unit => {
      if (unit.undead>0)
        supply += dwunits[unit.key].supply * unit.undead
    });
    let power = Math.round(100 - parseFloat(supply / 5).toFixed(0) / 100)
    const coordination = this.trainings.find(b => b.key === 'coordination');
    if(coordination)
    power = power + parseInt(coordination.lvl)/10
    if(power>=60)
    {
      if(power > 100)
      power = 100
      return power
    }
    else return 60
  }

  getResult() {
    const unitsObj = {};
    this.groups.forEach(group => {
      if (!unitsObj[group.key]) {
        unitsObj[group.key] = {
          amount: 0,
          dead: 0,
        };
      }
      unitsObj[group.key].amount += parseInt(group.amount);
      unitsObj[group.key].dead += parseInt(group.dead);
    })

    return Object.keys(unitsObj).map(key => {
      const unit = { key, amount: unitsObj[key].amount };
      if (unitsObj[key].dead) unit.dead = unitsObj[key].dead;
      return unit;
    });
  }
}
