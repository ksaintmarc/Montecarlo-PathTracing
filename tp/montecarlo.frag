layout(location=20) uniform int nb_emissives;
layout(location=21) uniform int NB_BOUNCES;
layout(location=24) uniform float refract_ind;

// Pile
const int MAX_STACK_SZ=9;
struct 
{
    vec3 O;
    vec3 D;
    vec3 Attenu;
} stack[MAX_STACK_SZ];

// indice  de sommet de pile
int stHead = -1;

void empile(in vec3 o, in vec3 d, in vec3 a)
{
    ++stHead;
    stack[stHead].O = o; 
    stack[stHead].D = d;
    stack[stHead].Attenu = a;
}

void depile(out vec3 o, out vec3 d, out vec3 a)
{
    o = stack[stHead].O; 
    d = stack[stHead].D;
    a = stack[stHead].Attenu;
    stHead--;
}


bool pile_vide()
{
    return stHead<0;
}

bool stack_full()
{
    return stHead == MAX_STACK_SZ-1;
}

void init_pile()
{
    stHead = -1;
}

vec3 sample_hemisphere(in float roughness)
{

	// Algo echna:
	// Z <- rand
	// beta <- Z : angle/plan_xy
	// alpha <- rand
	// x,y,z <- alpha,beta : coord polaire -> cartesienne

    float alpha = roughness * roughness;


    float beta = 2.0 * PI * random_float();

    float tanTheta2 = -alpha * alpha * log(1.0 - random_float());
    float cosTheta = 1.0 / sqrt(1.0 + tanTheta2);
    float sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));

    vec3 localDir = vec3(cos(beta) * sinTheta, sin(beta) * sinTheta, cosTheta);

    return normalize(localDir);
}

vec3 random_ray(in vec3 D, in float roughness)
{
	// Algo orientation échantillon
	// choisir un W normalisé non colineaire à D
	// U orthogonal à D et W
	// V tq U,V,D repère ortho-normé direct
	// mettre  U,V,D dans une  matrice 3x3 de changement de repère M
	// multiplier votre echantillon par M pour bien l'orienter
	// ici par de matrice 4x4 car pas de translation

	vec3 W = normalize(vec3(D.x,D.y+5.0,D.z+3.0));
	vec3 U = normalize(cross(D,W));
	vec3 V = normalize(cross(D,U));

	mat3 M = mat3(U,V,D);

	return normalize(M * sample_hemisphere(roughness));
}

float rSchlick(in vec3 I, in vec3 N)
{
    float r0 = (refract_ind-1.0) / (refract_ind+1.0);
    r0 *= r0;
        
    float x  = 1.0 - dot(N,I);
    return clamp(r0 + (1.0 - r0) * x * x * x * x * x, 0.0,1.0);
}

vec3 random_path(in vec3 Dir, in vec3 Orig)
{
	vec3 D = Dir;
    vec3 O = Orig;

    vec3 total = vec3(0);
    init_pile();
    empile(O,D,vec3(0.8));

    for(int i=0; (i<NB_BOUNCES) && (!pile_vide()); ++i)
    {
        vec3 attenu;
		
		
        depile(O,D,attenu);
	    traverse_all_bvh(O,D);

		//Faux ciel 
	    if (!hit())
		    return total + attenu * mix (vec3(0.5,0.5,0.9),vec3(1.0,1.0,0.8),max(0.0,D.z));;
		
		vec3 new_attenu; 
	    vec3 N;
	    vec3 P;
	    intersection_info(N,P);
	    vec4 mat = intersection_mat_info();
	    vec4 col = intersection_color_info();
        vec3 ray = random_ray(N, 1-mat.g);
		
		float rs = rSchlick(D,N);

		vec3 R = reflect(-ray,N);
		vec3 E = normalize(O-P);
		float se = mix(100,2,mat.g);
		float spec = pow(max(0.0,dot(E,R)),se) ;

		total += col.xyz * 0.1 + attenu * mat.b * (1.0-mat.r) * col.a ;
        
		
        if (mat.b <= 0.5 && !stack_full()){ 
			//reflection
			if(mat.r>0 && col.a == 1){
				new_attenu = col.xyz * attenu + attenu * col.a * rs * spec * mix(attenu,col.xyz, mat.r);
				empile(P+BIAS*N, random_ray(reflect(D,N), 1-mat.r * mat.g), new_attenu );
			}
			//refraction
			else if(col.a < 1 && mat.r==0){
				new_attenu = col.xyz * attenu +  attenu *(1.0-col.a) * (1.0 - rs) * spec * mix(attenu,col.xyz, mat.r);
				O = P-BIAS*N; // Attention au sens
				D = refract(D,N,refract_ind);
				traverse_all_bvh(O,D);
				intersection_info(N,P);
				empile(P+BIAS*N, refract(D,-N, 1/refract_ind), new_attenu );
			}
			else if(col.a < 1 && mat.r >0){
				float r = random_float();
				if(r>0.5){
					new_attenu = col.xyz * attenu + attenu * col.a * rs * spec * mix(attenu,col.xyz, mat.r);
					empile(P+BIAS*N, random_ray(reflect(D,N), 1-mat.r * mat.g), new_attenu );
				}
				else{
					new_attenu = col.xyz * attenu +  attenu *(1.0-col.a) * (1.0 - rs) * spec * mix(attenu,col.xyz, mat.r);
					O = P-BIAS*N; 
					traverse_all_bvh(O,D);
					intersection_info(N,P);
					empile(P+BIAS*N, refract(D,-N, 1/refract_ind), new_attenu );
				}
			}
			//diffus
			else{
				new_attenu =  col.xyz * attenu + attenu * spec * mix(attenu, col.xyz,  mat.r);
				empile(P+BIAS*N, ray, new_attenu );
			}	
		}
        else 
            return total;

    }
	return vec3(0,0,0); 
}


vec3 raytrace(in vec3 Dir, in vec3 Orig)   
{
	// init de la graine du random
	srand();
	// calcul de la lumière captée par un chemin aléatoire
	return random_path(normalize(Dir),Orig);
}

